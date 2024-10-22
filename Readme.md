# GitHub Repository Scanner API (Test)

## Overview

This project is a simple GraphQL API server built using Apollo Server that interacts with GitHub's GraphQL and REST APIs. It allows users to:

- **List repositories** for a given GitHub username.
- **Fetch detailed repository information**, including file details, YAML configuration files, and active webhooks.

The server limits concurrent repository details fetching to 2 repositories at a time to avoid overloading the GitHub API and improve efficiency.

## Features

- **List Repositories**: Get basic information (name, size, owner) about a user's public repositories.
- **Repository Details**: Fetch more detailed information about a specific repository, including the number of files, YAML file contents, and webhooks.
- **Concurrency Limit**: Ensure that no more than 2 repository detail requests are processed simultaneously across all users.
- **Built with Apollo Server**: Simplifies building and running GraphQL servers.

## Installation

### Prerequisites

- Node.js (version 14.x or later)
- npm or yarn package manager
- A GitHub Personal Access Token (with `repo` and `admin:repo_hook` permissions)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/github-repo-scanner.git
   cd github-repo-scanner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the server**:
   ```bash
   npm start
   ```

   The server will start at `http://localhost:4000` by default.

## Usage

### GraphQL Queries

- **List Repositories**
  ```graphql
  query {
    listRepositories(username: "GitHubUser", token: "yourGitHubToken") {
      name
      size
      owner
    }
  }
  ```

- **Repository Details**
  ```graphql
  query {
    repositoryDetails(username: "GitHubUser", token: "yourGitHubToken", repoName: "RepoName") {
      name
      size
      owner
      private
      numFiles
      yamlContent {
        name
        text
      }
      webhooks
    }
  }
  ```

### Environment Variables

You will need a GitHub Personal Access Token to make requests. You can either provide this token in your queries or modify the code to use an environment variable for better security.

## Concurrency Limiting

This API limits the number of concurrent repository detail fetches to 2 using the `p-limit` library. This ensures better API performance and prevents GitHub API rate limits from being reached too quickly.

## File Structure

- `index.ts`: Main server file that defines the GraphQL schema, resolvers, and starts the server.
- `package.json`: Contains the project’s metadata and dependencies.
- `README.md`: This file.
