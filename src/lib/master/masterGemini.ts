// arquivo: chamada para Gemini (Interactions API)
// local: src\lib\master\masterGemini.ts

import {GoogleGenAI} from "@google/genai";
import type {ChatMessage} from '@/types/master';
import type {Master} from '@/types/campaign';
import * as fs from "node:fs";

// Chama API do Gemini sem estado
export async function callGemini({master, systemPrompt, messages, format}: {master: Master; systemPrompt: string; messages: ChatMessage[]; format?: object}): Promise<{text: string}> {
  if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}

  const ai = new GoogleGenAI({apiKey: master?.apiKey || ''});

  // Organiza as mensagens no formato correto
  const inputSteps: Array<{type: 'user_input' | 'model_output'; content: {type: 'text'; text: string}[]}> = messages.map((m) => ({
    type: m.type === 'player' ? 'user_input' : 'model_output',
    content: [{type: 'text', text: m.text}],
  }));

  try {
    const interaction = await ai.interactions.create({
      model: master.model ?? '',
      system_instruction: systemPrompt,
      input: inputSteps,
      ...(format ? {response_format: {type: "text", mime_type: "application/json", schema: format}} : {}),
      stream: false,
      store: false,
    });

    if (!interaction.output_text) {
      throw new Error('Pedido enviado mas o texto não foi gerado.');
    }

    return {text: interaction.output_text};
  }
  catch (error) {
    throw new Error(`Erro na API(stateless) do Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// Chama API do Gemini padrão
export async function callGeminiChat({master, message, systemPrompt, previousInteractionId}: {master: Master; message: ChatMessage; systemPrompt?: string; previousInteractionId?: string}): Promise<{text: string; interactionId: string}> {
  if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}

  const ai = new GoogleGenAI({apiKey: master.apiKey});

  try {
    const interaction = await ai.interactions.create({
      model: master.model ?? '',
      input: message.text,
      system_instruction: systemPrompt,
      previous_interaction_id: previousInteractionId,
      stream: false,
    });

    if (!interaction.output_text) {
      throw new Error('Pedido enviado mas o texto não foi gerado.');
    }

    return {text: interaction.output_text, interactionId: interaction.id};
  }
  catch (error) {
    throw new Error(`Erro na API(stateful) do Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// Deleta a interação do GeminiChat
export async function deleteGeminiChat({master, previousInteractionId}: {master: Master; previousInteractionId: string}): Promise<{success: boolean}> {
  if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}

  const ai = new GoogleGenAI({apiKey: master.apiKey});

  try {
    await ai.interactions.delete(previousInteractionId);

    return {success: true};
  }
  catch (error) {
    throw new Error(`Erro ao deletar a Interação na API do Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// Chama API de Documentos do Gemini 
export async function callGeminiDoc({master, systemPrompt, path,}: {master: Master; systemPrompt: string; path: string;}): Promise<{text: string}> {
  if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}

  const ai = new GoogleGenAI({apiKey: master.apiKey});

  // Lê o arquivo PDF local do caminho fornecido
  const pdfBuffer = fs.readFileSync(path);
  const fileBlob = new Blob([pdfBuffer], {type: "application/pdf"});

  // Faz o upload do arquivo na Files API do Gemini
  const file = await ai.files.upload({
    file: fileBlob,
    config: {displayName: path.split("/").pop() ?? "document.pdf",},
  });

  // Aguarda o processamento do arquivo na API
  if (!file?.name) {throw new Error("Livro enviado, mas não encontrado.");}
  
  let getFile = await ai.files.get({name: file.name});
  while (getFile.state === "PROCESSING") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    getFile = await ai.files.get({name: file.name});
  }

  if (getFile.state === "FAILED") {
    throw new Error("Falha no processamento do arquivo PDF pela API do Gemini.");
  }  

  try {
    const interaction = await ai.interactions.create({
      model: master.model ?? '',
      system_instruction: systemPrompt,
      input: [
        {type: "document", uri: file.uri, mime_type: file.mimeType},
      ],
    });

    return {text: interaction.output_text ?? 'API(Doc) do Gemini não gerou texto.'};
  } 
  catch (error) {
    throw new Error(
      `Erro na API(Doc) do Gemini: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}


// Chama API de Imagem do Gemini
export async function callGeminiImg({master, prompt, format}: {master: Master; prompt: string; format: any}): Promise<{text: string}> {
  if (!master?.apiKey) {throw new Error("ApiKey incorreta.");}

  const ai = new GoogleGenAI({apiKey: master.apiKey});

  try {
    const interaction = await ai.interactions.create({
      model: master.model ?? 'gemini-3.1-flash-lite-image',
      input: prompt,
      response_format: {
        type: "image",
        mime_type: format?.mime_type ?? "image/jpg",
        aspect_ratio: format?.aspect_ratio ?? "1:1",
        image_size: format?.image_size ?? "512"
      }
    });

    if (!interaction.output_image?.data) {throw new Error("Imagem não criada.");}

    return {text: interaction.output_image.data}; // lembrar que o tratamento de tamanho pode não caber na db
  }
  catch (error) {
    throw new Error(`Erro na API(Img) do Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}