import { Buffer } from "buffer";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

let currentSound: Audio.Sound | null = null;

export async function speakText(text: string): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log("No API key");
    return;
  }

  try {
    console.log("Calling ElevenLabs...");

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        }),
      }
    );

    if (!response.ok) {
      console.log("ElevenLabs error:", await response.text());
      return;
    }

    const arrayBuffer = await response.arrayBuffer();

    // 🔥 THIS is the correct conversion for Expo Go
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const fileUri = `${FileSystem.cacheDirectory}sipsafe.mp3`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    if (currentSound) {
      await currentSound.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true }
    );

    currentSound = sound;

    console.log("Playing audio...");
  } catch (err) {
    console.log("TTS error:", err);
  }
}