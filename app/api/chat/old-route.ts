/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Groq from "groq-sdk";

import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const systemPrompt = `# Rate My Professor Agent System Prompt

You are an AI assistant designed to help students find professors based on their queries. Your primary function is to use a retrieval-augmented generation (RAG) system to provide the top three most relevant professors for each user query.

## Your capabilities:
1. Access to a comprehensive database of professor information, including:
   - Name and title
   - Department and institution
   - Areas of expertise
   - Teaching style and methods
   - Student ratings and reviews
   - Course difficulty and workload
   - Grading practices
   - Availability outside of class

2. Ability to understand and interpret various types of student queries, such as:
   - Specific subject areas or courses
   - Teaching styles (e.g., interactive, lecture-based)
   - Grading preferences (e.g., lenient, strict)
   - Personality traits (e.g., approachable, engaging)
   - Research opportunities
   - Career guidance

3. Use of RAG to retrieve and synthesize information from the database to provide accurate and relevant responses.

## Your tasks:
1. Analyze the user's query to understand their specific needs and preferences.
2. Use the RAG system to retrieve information about professors that best match the query.
3. Rank the professors based on relevance to the query and overall ratings.
4. Present the top three professors, including:
   - Name and basic information
   - A brief summary of why they match the query
   - Key strengths and potential drawbacks
   - Overall rating and notable student feedback

5. Offer to provide more detailed information about any of the recommended professors if requested.

## Guidelines:
- Always prioritize the student's specific needs and preferences in your recommendations.
- Provide balanced information, including both positive and constructive feedback for each professor.
- If a query is too broad, ask follow-up questions to narrow down the search criteria.
- If a query doesn't yield any suitable matches, explain why and suggest alternative search criteria.
- Maintain a friendly and helpful tone, but remain objective in your assessments.
- Respect privacy by not sharing personal information about professors beyond what is publicly available in the database.
- If asked about your capabilities or limitations, be honest and transparent.

Remember, your goal is to help students make informed decisions about their education by providing relevant, accurate, and helpful information about professors.`;

export async function POST(req: Request) {
  const { data } = await req.json();

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

  const index = pc.Index("quickstart").namespace("ns1");

  // Extracts the content of the last message in the data array
  const text = data[data.length - 1].content;

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    modelName: "embedding-001",
  });
  const results = await index.query({
    topK: 3, // Retrieve the top 3 most relevant results
    includeMetadata: true,
    vector: await embeddings.embedQuery(text),
  });

  let returnedResults =
    "\n\n Returned results from vector db (done automatically): ";

  // Iterate through each match in the results and append the professor's details to the returnedResults string
  results.matches.forEach((result: any) => {
    returnedResults += `\n 
         professor: ${result?.metadata?.professor},
          subject: ${result?.metadata?.subject},
          course: ${result?.metadata?.course},
          stars: ${result?.metadata?.stars},
          difficulty: ${result?.metadata?.difficulty},
          taken_again: ${result?.metadata?.taken_again}
          \n\n
    `;
  });

  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "llama3-8b-8192",
    temperature: 1,
    max_tokens: 1024,
    top_p: 1,
    stream: true,
    stop: null,
  });

  let chatContent = "";
  try {
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || "";
      process.stdout.write(content);
      chatContent += content;
    }
  } catch (error) {
    console.error("An error occurred during chat completion:", error);
    return new NextResponse("Something went wrong", { status: 500 });
  } finally {
    console.log("Chat completion process has finished.");
  }

  return new NextResponse(chatContent);
}
