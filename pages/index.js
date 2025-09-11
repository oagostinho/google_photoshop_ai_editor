import Messages from "components/messages";
import PromptForm from "components/prompt-form";
import Head from "next/head";
import { useEffect, useState } from "react";

import Footer from "components/footer";

import prepareImageFileForUpload from "lib/prepare-image-file-for-upload";
import { getRandomSeed } from "lib/seeds";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const appName = "Paint by Text";
export const appSubtitle = "Edit your photos using written instructions, with the help of an AI.";
export const appMetaDescription = "Edit your photos using written instructions, with the help of an AI.";

function TokenModal({ onTokenSet }) {
  const [token, setToken] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <form
        className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-2xl border border-gray-200 relative animate-in fade-in"
        onSubmit={e => {
          e.preventDefault();
          if (token) {
            localStorage.setItem("googleApiKey", token);
            onTokenSet(token);
          }
        }}
        aria-modal="true"
        role="dialog"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Enter your Google Generative AI API key</h2>
        <p className="mb-4 text-center text-gray-600">
          Create or view your API key at {" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            aistudio.google.com/app/apikey
          </a>
        </p>
        <input
          className="w-full border rounded p-3 mb-4 text-lg"
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="AIza..."
          required
          autoFocus
        />
        <button className="w-full bg-black text-white px-4 py-3 rounded text-lg font-semibold" type="submit">
          Start painting
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [predictions, setPredictions] = useState([]); // legacy; no longer used for AI SDK flow
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seed] = useState(getRandomSeed());
  const [initialPrompt, setInitialPrompt] = useState(seed.prompt);
  const [apiToken, setApiToken] = useState(null);
// Removed showTokenForm state

  // set the initial image from a random seed
  useEffect(() => {
    setEvents([{ image: seed.image }]);
    const storedToken = localStorage.getItem("googleApiKey");
    if (storedToken) setApiToken(storedToken);
    // Removed setShowTokenForm
  }, [seed.image]);

  const handleImageDropped = async (image) => {
    try {
      image = await prepareImageFileForUpload(image);
    } catch (error) {
      setError(error.message);
      return;
    }
    setEvents(events.concat([{ image }]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiToken) return;

    const prompt = e.target.prompt.value;
    const lastImage = events.findLast((ev) => ev.image)?.image;

    setError(null);
    setIsProcessing(true);
    setInitialPrompt("");

    // make a copy so that the second call to setEvents here doesn't blow away the first. Why?
    const myEvents = [...events, { prompt }];
    setEvents(myEvents);

    const body = {
      prompt,
      input_image: lastImage,
    };

    // New AI SDK flow: generate the image in a single request
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-google-api-key": apiToken,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data?.detail || "Image generation failed");
      setIsProcessing(false);
      return;
    }

    setEvents(
      myEvents.concat([
        { image: data.image },
      ])
    );

    setIsProcessing(false);
  };

  const startOver = async (e) => {
    e.preventDefault();
    setEvents(events.slice(0, 1));
    setError(null);
    setIsProcessing(false);
    setInitialPrompt(seed.prompt);
  };

  const handleTokenSet = (token) => {
    setApiToken(token);
    // Removed setShowTokenForm
  };

  const handleLogout = () => {
    localStorage.removeItem("googleApiKey");
    setApiToken(null);
    // Removed setShowTokenForm
  };

  return (
    <div className="relative">
      <Head>
        <title>{appName}</title>
        <meta name="description" content={appMetaDescription} />
        <meta property="og:title" content={appName} />
        <meta property="og:description" content={appMetaDescription} />
        <meta property="og:image" content="https://paintbytext.chat/opengraph.jpg" />
      </Head>

      <main className={`container max-w-[700px] mx-auto p-5 transition-filter duration-300 ${!apiToken ? 'filter blur-sm brightness-75 pointer-events-none select-none' : ''}`}>
        {!apiToken ? null : (
          <>
            <div className="flex justify-end mb-4">
              <button className="text-sm underline text-blue-600" onClick={handleLogout}>
                Log out / Change token
              </button>
            </div>
            <hgroup>
              <h1 className="text-center text-5xl font-bold m-6">{appName}</h1>
              <p className="text-center text-xl opacity-60 m-6">
                {appSubtitle}
              </p>
            </hgroup>

            <Messages
              events={events}
              isProcessing={isProcessing}
              onUndo={(index) => {
                setInitialPrompt(events[index - 1].prompt);
                setEvents(
                  events.slice(0, index - 1).concat(events.slice(index + 1))
                );
              }}
            />

            <PromptForm
              initialPrompt={initialPrompt}
              isFirstPrompt={events.length === 1}
              onSubmit={handleSubmit}
              disabled={isProcessing}
            />

            <div className="mx-auto w-full">
              {error && <p className="bold text-red-500 pb-5">{error}</p>}
            </div>

            <Footer
              events={events}
              startOver={startOver}
              handleImageDropped={handleImageDropped}
            />
          </>
        )}
      </main>
      {!apiToken && <TokenModal onTokenSet={handleTokenSet} />}
    </div>
  );
}
