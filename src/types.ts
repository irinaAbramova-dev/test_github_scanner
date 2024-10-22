interface GitHubGraphQlResponse {
    user: GitHubUser;
}

interface GitHubUser {
    repositories: GitHubRepositories;
}

interface GitHubRepositories {
    nodes: RepositoryNode[];
}

interface RepositoryNode {
    name: string;
    diskUsage: number;
    owner: RepositoryOwner;
}

interface RepositoryOwner {
    login: string;
}

interface RepositoryDetailsResponse {
    repository: RepositoryDetails;
}

interface RepositoryDetails {
    name: string;
    diskUsage: number;
    owner: RepositoryOwner;
    isPrivate: boolean;
    object: RepositoryObject | null;
}

interface RepositoryObject {
    entries: FileEntry[];
}

interface FileEntry {
    name: string;
}

interface YamlFileResponse {
    repository: YamlFileRepository;
}

interface YamlFileRepository {
    object: YamlFileContent;
}

interface YamlFileContent {
    text: string;
}

interface Webhook {
    config: WebhookConfig;
    active: boolean;
}

interface WebhookConfig {
    url: string;
}
