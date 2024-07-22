# contentstack-management-cli

This CLI application is designed to quickly republish entries in Contentstack to trigger webhooks, as the Contentstack UI interface can be cumbersome and time-consuming to use for such tasks.

## Features

- Fetch entries from Contentstack based on selected locale and content type. Only fetch published entries using the Contentstack Delivery API.
- Publish entries to specified environments.
- Batch processing to handle large numbers of entries efficiently.
- Handles API rate limits with retries and exponential backoff.
-

## Prerequisites

- Node.js (v18 or later)
- Contentstack API Tokens: Delivery and Management

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ShukhratbekDev/contentstack-management-cli.git
cd contentstack-management-cli
```

2. Install the dependencies:

```bash
npm install
```

3. Create a .env file in the project root with the following contents:

```
CS_MANAGEMENT_TOKEN=your_management_token
CS_API_KEY=your_api_key
CS_DELIVERY_TOKEN=your_delivery_token
```

## Usage

1. Start the CLI application:

```bash
npm start
```

2. Follow the prompts to select the environment and content type. The application will then fetch and publish the entries accordingly.

## Environment Variables

The following environment variables are required for the CLI to operate:

- CS_MANAGEMENT_TOKEN: Your Contentstack management token.
- CS_API_KEY: Your Contentstack API key.
- CS_DELIVERY_TOKEN: Your Contentstack delivery token.

## Example

After you start the CLI application by running npm start, you'll be prompted to select the environment (prod, stage) and content type (product, review). The application will then fetch all entries for the selected environment and content type and publish them.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
