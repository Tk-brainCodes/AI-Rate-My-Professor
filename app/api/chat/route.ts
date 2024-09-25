/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as cheerio from "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { z } from "zod";
import pLimit from "p-limit";
import { logger } from "@/config/logger";
import {
  SYSTEM_PROMPT,
  MAX_URLS,
  PINECONE_INDEX_NAME,
  PINECONE_NAMESPACE,
  GROQ_MODEL,
  EMBEDDING_MODEL,
  MAX_TOKENS,
  TEMPERATURE,
  TOP_P,
} from "@/config/system-prompt";

interface ProfessorData {
  professor: string;
  subject: string;
  course: string;
  stars: string;
  difficulty: string;
  taken_again: string;
  reputation?: string;
  location?: string;
  opportunities?: string;
  facilities?: string;
  internet?: string;
  food?: string;
  clubs?: string;
  social?: string;
  happiness?: string;
  safety?: string;
}

const RequestSchema = z.object({
  urls: z.array(z.string().url()).max(MAX_URLS),
  data: z.array(
    z.object({
      content: z.string(),
    })
  ),
});

// Dynamically load and extract professor data from web pages
const extractProfessorData = (html: string): ProfessorData[] => {
  try {
    const $ = cheerio.load(html);
    const professorData: ProfessorData[] = [];

    // Extract relevant elements containing professor data
    const professorElements = $("body *").filter((i, el) => {
      const hasName = $(el).text().toLowerCase().includes("professor");
      const hasRating =
        $(el).text().toLowerCase().includes("stars") ||
        $(el).text().toLowerCase().includes("rating");
      return hasName || hasRating;
    });

    professorElements.each((index, element) => {
      const professor =
        $(element).find(":contains('Professor')").text() || "Unknown";
      const subject =
        $(element).find(":contains('Subject')").text() || "Unknown";
      const course = $(element).find(":contains('Course')").text() || "Unknown";
      const stars =
        $(element).find(":contains('Stars'), :contains('rating')").text() ||
        "Unknown";
      const difficulty =
        $(element).find(":contains('Difficulty')").text() || "Unknown";
      const takenAgain =
        $(element).find(":contains('Taken Again')").text() || "Unknown";

      const reputation =
        $(element).find(":contains('Reputation')").text() || "Unknown";
      const location =
        $(element).find(":contains('Location')").text() || "Unknown";
      const opportunities =
        $(element).find(":contains('Opportunities')").text() || "Unknown";
      const facilities =
        $(element).find(":contains('Facilities')").text() || "Unknown";
      const internet =
        $(element).find(":contains('Internet')").text() || "Unknown";
      const food = $(element).find(":contains('Food')").text() || "Unknown";
      const clubs = $(element).find(":contains('Clubs')").text() || "Unknown";
      const social = $(element).find(":contains('Social')").text() || "Unknown";
      const happiness =
        $(element).find(":contains('Happiness')").text() || "Unknown";
      const safety = $(element).find(":contains('Safety')").text() || "Unknown";

      professorData.push({
        professor: professor.trim(),
        subject: subject.trim(),
        course: course.trim(),
        stars: stars.trim(),
        difficulty: difficulty.trim(),
        taken_again: takenAgain.trim(),
        reputation: reputation.trim(),
        location: location.trim(),
        opportunities: opportunities.trim(),
        facilities: facilities.trim(),
        internet: internet.trim(),
        food: food.trim(),
        clubs: clubs.trim(),
        social: social.trim(),
        happiness: happiness.trim(),
        safety: safety.trim(),
      });
    });

    if (professorData.length === 0) {
      console.log("No professor data found in this structure.");
    }

    return professorData;
  } catch (error) {
    logger.error("Error extracting professor data:", error);
    return [];
  }
};

// Function to load and process documents from URLs
const loadDocumentsFromUrls = async (urls: string[]) => {
  const limit = pLimit(5); // Limit concurrent requests
  const loaders = urls.map((url) =>
    limit(() => new CheerioWebBaseLoader(url).load())
  );
  const docs = await Promise.all(loaders);
  return docs.flat();
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, urls } = RequestSchema.parse(body);

    console.log("urls coming from frontend", urls)

    const docs = await loadDocumentsFromUrls(urls);

    console.log("loaded docs from url :", docs)

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });

    const index = pc.Index(PINECONE_INDEX_NAME).namespace(PINECONE_NAMESPACE);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
      modelName: EMBEDDING_MODEL,
    });

    const extractedProfessors = docs.flatMap((doc) =>
      extractProfessorData(doc.pageContent)
    );
    await Promise.all(
      extractedProfessors.map(async (professor) => {
        try {
          const vector = await embeddings.embedQuery(
            `${professor.professor}, ${professor.subject}, ${professor.course}, ${professor.stars}, ${professor.difficulty}, ${professor.taken_again}, ${professor.reputation}, ${professor.location}, ${professor.opportunities}, ${professor.facilities}, ${professor.internet}, ${professor.food}, ${professor.clubs}, ${professor.social}, ${professor?.happiness}, ${professor.safety} `
          );
          await index.upsert([
            {
              id: professor.professor,
              values: vector,
              metadata: { ...professor },
            },
          ]);
        } catch (error) {
          logger.error(
            `Error upserting professor ${professor.professor}:`,
            error
          );
        }
      })
    );

    const text = data[data.length - 1].content;
    const queryEmbedding = await embeddings.embedQuery(text);
    const results = await index.query({
      topK: 3,
      includeMetadata: true,
      vector: queryEmbedding,
    });

    let returnedResults = "\n\n Returned results from vector db: ";
    results.matches.forEach((result: any) => {
      returnedResults += `\n ${JSON.stringify(result.metadata, null, 2)}\n\n`;
    });

    const lastMessage = data[data.length - 1].content;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    // Updated message format
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...lastDataWithoutLastMessage.map((msg) => ({
        role: "user" as const,
        content: msg.content,
      })),
      { role: "user" as const, content: lastMessage },
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: GROQ_MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      top_p: TOP_P,
      stream: true,
      stop: null,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(content);
          }
          controller.close();
        } catch (error) {
          logger.error("Error during chat completion:", error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    logger.error("API error:", error);
    return new NextResponse(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
