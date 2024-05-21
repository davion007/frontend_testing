const { chromium } = require('playwright');

const testConfigs = [
  {
    sessionId: 'wellbeing',
    index: 'wellbeing',
    messages: ['Hello', 'How are you?', 'What can you help me with?'],
  },
  {
    sessionId: 'session2',
    index: 'bluetea',
    messages: ['Hi there', 'Can you assist me with something?', 'Thanks for your help!'],
  },
  // Add more test configurations as needed
];

async function waitForLastAIMessage(page) {
  let lastAIMessage = '';
  let newAIMessage = '';

  do {
    lastAIMessage = newAIMessage;
    await page.waitForTimeout(3000); // Wait for 3 seconds

    // Get the last AI message
    newAIMessage = await page.textContent('#chatbot-container #AI:last-of-type');
  } while (newAIMessage !== lastAIMessage);

  await page.waitForTimeout(3000); // Wait for an additional 3 seconds
  return lastAIMessage;
}

async function runTest(testConfig) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`http://localhost:3000/chat/v1?index=${testConfig.index}`);

    // Wait for the chatbot container to load
    await page.waitForSelector('#chatbot-container');

    // Send demo messages
    for (const message of testConfig.messages) {
      await page.click('#text-input-chat');
      await page.type('#text-input-chat', message);
      await page.click('#send-button');

      // Wait for the last AI message
      const lastAIMessage = await waitForLastAIMessage(page);
      console.log(`[${testConfig.sessionId}] Last AI message:`, lastAIMessage);
    }

    // Check if the user messages are displayed correctly
    const userMessages = await page.$$eval('#chatbot-container #USER', (elements) =>
      elements.map((el) => el.textContent)
    );
    console.log(`[${testConfig.sessionId}] User messages:`, userMessages);

    // Check if the AI responses are displayed correctly
    const aiResponses = await page.$$eval('#chatbot-container #AI', (elements) =>
      elements.map((el) => el.textContent)
    );
    console.log(`[${testConfig.sessionId}] AI responses:`, aiResponses);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runTests() {
  const testPromises = testConfigs.map((testConfig) => runTest(testConfig));
  await Promise.all(testPromises);
}

runTests();