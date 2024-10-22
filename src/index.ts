import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import pLimit from 'p-limit';

// Define typeDefs using GraphQL schema
const typeDefs = `
  type YamlContent {
    name: String!
    text: String!
  }
  
  type Repository {
    name: String!
    size: Int!
    owner: String!
  }
  
  type RepositoryDetails {
    name: String!
    size: Int!
    owner: String!
    private: Boolean!
    numFiles: Int
    yamlContent: YamlContent
    webhooks: [String]
  }

  type Query {
    listRepositories(username: String!, token: String!): [Repository!]!
    repositoryDetails(username: String!, token: String!, repoName: String!): RepositoryDetails
  }
`;

// Limit concurrent repository details fetching to 2
const limit = pLimit(2);

// GraphQL query and resolver logic
const fetchGitHubGraphQlApi = async <T>(query: string, variables: object, token: string): Promise<T> => {
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
    });

    const result: any = await response.json();
    if (!response.ok || result.errors) {
        const message = result.errors ? result.errors.map((e: any) => e.message).join(', ') : result.message;
        throw new Error(`🛑 GitHub GraphQL API error: ${message}`);
    }
    return result.data;
};

const fetchGitHubRestApi = async <T>(url: string, token: string): Promise<T> => {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const result: any = await response.json();
    if (!response.ok || result.errors) {
        const message = result.errors ? result.errors.map((e: any) => e.message).join(', ') : result.message;
        throw new Error(`🛑 GitHub REST API error: ${message}`);
    }

    return result;
};

const fetchWebhooks = async (owner: string, token: string, repoName: string): Promise<string[]> => {
    const url = `https://api.github.com/repos/${owner}/${repoName}/hooks`;
    const webhooks: Webhook[] = await fetchGitHubRestApi<Webhook[]>(url, token);
    return webhooks.filter((hook: any) => hook.active).map((hook: any) => hook.config.url);
};

const LIST_REPOSITORIES_QUERY = `
  query ($owner: String!) {
    user(login: $owner) {
      repositories(first: 10) {
        nodes {
          name
          diskUsage
          owner { login }
        }
      }
    }
  }
`;

const REPOSITORY_DETAILS_QUERY = `
  query ($owner: String!, $repoName: String!) {
    repository(owner: $owner, name: $repoName) {
      name
      diskUsage
      owner { login }
      isPrivate: isPrivate
      object(expression: "HEAD:") {
        ... on Tree {
          entries { name }
        }
      }
    }
  }
`;

const YAML_DETAILS_QUERY = `
  query ($owner: String!, $repoName: String!, $fileName: String!) {
    repository(owner: $owner, name: $repoName) {
      object(expression: $fileName) {
        ... on Blob {
          text
        }
      }
    }
  }
`;

const resolvers = {
    Query: {
        listRepositories: async (_: unknown, { username: owner, token }: { username: string, token: string }) => {
            const { user } = await fetchGitHubGraphQlApi<GitHubGraphQlResponse>(
                LIST_REPOSITORIES_QUERY,
                { owner },
                token
            );

            return user.repositories.nodes.map((repo: any) => ({
                name: repo.name,
                size: repo.diskUsage,
                owner: repo.owner.login,
            }));
        },

        repositoryDetails: async (_: unknown, { username: owner, token, repoName }: { username: string, token: string, repoName: string }) => {
            // Use limit to ensure only 2 fetches happen at the same time
            return limit(async () => {
                const { repository } = await fetchGitHubGraphQlApi<RepositoryDetailsResponse>(
                    REPOSITORY_DETAILS_QUERY,
                    { owner, repoName },
                    token
                );

                // Extract YAML file details
                const yamlFile = repository.object?.entries?.find((file: any) => file.name.endsWith('.yml'));
                let yamlContent = null;

                if (yamlFile) {
                    const yamlData = await fetchGitHubGraphQlApi<YamlFileResponse>(
                        YAML_DETAILS_QUERY,
                        { owner, repoName, fileName: `HEAD:${yamlFile.name}` },
                        token
                    );
                    yamlContent = { name: yamlFile.name, text: yamlData.repository.object.text };
                }

                // Fetch webhooks using REST API
                const webhooks = await fetchWebhooks(owner, token, repoName);

                return {
                    name: repository.name,
                    size: repository.diskUsage,
                    owner: repository.owner.login,
                    private: repository.isPrivate,
                    numFiles: repository.object?.entries?.length || 0,
                    yamlContent,
                    webhooks,
                };
            })
        },
    },
};

// Initialize Apollo server
const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, { listen: { port: 4000 } })
    .then(({ url }) => console.log(`🚀 Server ready at ${url}`));
