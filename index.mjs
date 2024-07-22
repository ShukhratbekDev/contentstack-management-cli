import axios from 'axios';
import retry from 'async-retry';
import inquirer from 'inquirer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const locales = ['en-us', 'ru-ru', 'uk-ua', 'es', 'hu-hu'];
const managementToken = process.env.CS_MANAGEMENT_TOKEN;
const apiKey = process.env.CS_API_KEY;
const deliveryToken = process.env.CS_DELIVERY_TOKEN;

// Function to fetch entries for a specific locale with pagination
const fetchEntriesForLocale = async (locale, environment, contentType) => {
  let allEntries = [];
  let skip = 0;
  const limit = 100;
  let totalEntriesFetched = 0;
  let totalEntries = 0;
  /**
   * using Contentstack Delivery API to get all entries, only pushed entries will be fetched
   * https://www.contentstack.com/docs/developers/apis/content-delivery-api#all-entries
   */
  const fetchURL = `https://eu-cdn.contentstack.com/v3/content_types/${contentType}/entries`;

  try {
    do {
      const response = await axios.get(fetchURL, {
        params: {
          locale: locale,
          limit: limit,
          skip: skip,
          environment: environment,
          include_count: true,
          'only[BASE][]': ['uid', 'locale', '_version'],
        },
        headers: {
          'Content-Type': 'application/json',
          access_token: deliveryToken,
          api_key: apiKey,
        },
      });

      const { entries, count } = response.data;

      // Update the total number of entries
      if (skip === 0) {
        totalEntries = count;
      }

      // Add fetched entries to the allEntries array
      allEntries = allEntries.concat(entries);

      // Update the number of fetched entries
      totalEntriesFetched += entries.length;

      // Update the skip value for the next iteration
      skip += limit;

      console.log(
        `Fetched ${entries.length} entries for locale ${locale}, total fetched: ${totalEntriesFetched}/${count}`
      );
    } while (totalEntriesFetched < totalEntries);

    console.log(`Successfully fetched all entries for locale ${locale}: ${totalEntriesFetched} entries.`);
    return allEntries;
  } catch (error) {
    console.error(`Error fetching entries for locale ${locale}:`, error);
    throw error;
  }
};

// Function to fetch all entries for all locales
const fetchAllEntries = async (environment, contentType) => {
  const entriesByLocale = {};

  for (const locale of locales) {
    entriesByLocale[locale] = await fetchEntriesForLocale(locale, environment, contentType);
  }

  return entriesByLocale;
};

// Function to publish entries for a specific locale
const publishEntriesForLocale = async (entries, locale, environment, contentType) => {
  /**
   * using Contentstack Management API to bulk publish
   * https://www.contentstack.com/docs/developers/apis/content-management-api#publish-entries-and-assets-in-bulk
   */
  const publishURL = 'https://eu-api.contentstack.com/v3/bulk/publish';
  const batchSize = 10;

  // Transform entries to the required format
  const entriesToPublish = entries.map((entry) => ({
    uid: entry.uid,
    content_type: contentType,
    version: entry._version,
    locale: entry.locale,
  }));

  // Split entries into batches of max 10 entries
  for (let i = 0; i < entriesToPublish.length; i += batchSize) {
    const batch = entriesToPublish.slice(i, i + batchSize);

    const requestBody = {
      entries: batch,
      locales: [locale],
      environments: [environment],
      publish_with_reference: false,
    };

    try {
      await retry(
        async () => {
          const response = await axios.post(publishURL, requestBody, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: managementToken,
              api_key: apiKey,
            },
          });
          console.log(
            `Successfully published batch for locale ${locale} in environment ${environment}:`,
            response.data
          );
        },
        {
          retries: 5, // Number of retry attempts
          factor: 2, // Exponential factor
          minTimeout: 5000, // Minimum wait time between retries (in milliseconds)
          maxTimeout: 64000, // Maximum wait time between retries (in milliseconds)
          onRetry: (error, attempt) => {
            console.log(
              `Retry ${attempt} for batch publish due to error:`,
              error.response ? error.response.data : error.message
            );
          },
        }
      );
    } catch (error) {
      console.error(
        `Error publishing batch for locale ${locale}:`,
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }
};

// Function to publish all entries split by locale
const publishAllEntries = async (entriesByLocale, environment, contentType) => {
  for (const locale of Object.keys(entriesByLocale)) {
    const entries = entriesByLocale[locale];
    await publishEntriesForLocale(entries, locale, environment, contentType);
  }
};

// Function to prompt user for inputs and run the script
const run = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Select the environment:',
      choices: ['stage', 'prod'], // please set yours environment
    },
    {
      type: 'list',
      name: 'contentType',
      message: 'Select the content type:',
      choices: ['articles', 'courses'], // please set yours content type
    },
  ]);

  const { environment, contentType } = answers;

  try {
    const entriesByLocale = await fetchAllEntries(environment, contentType);
    console.log('All entries fetched:');
    console.log(JSON.stringify(entriesByLocale, null, 2));

    await publishAllEntries(entriesByLocale, environment, contentType);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Start the CLI app
run();
