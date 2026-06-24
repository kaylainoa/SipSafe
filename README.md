# SipSafe

> Best Use of Digital Ocean — WiNGHacks 2026

A mobile app that helps you drink safer. SipSafe uses AI-powered drink verification, real-time BAC estimation, and emergency contact alerts to keep you and your crew safe on a night out.

## Features

- **AI Drink Verification** — Snap a photo of your drink and Google Gemini vision AI checks for signs of tampering, spiking, or spoofing
- **Live BAC Estimation** — Real-time blood alcohol content tracking using the Widmark formula, calibrated to your weight and gender
- **Drink Logging** — Log drinks by type and track them through the night
- **Night Receipt** — A receipt-style summary of last night's drinks with quantity and BAC contribution per drink
- **Consumption Analytics** — Bar chart and trend breakdown across 1D / 1W / 1M / 1Y / All time ranges
- **Emergency Alerts** — One-tap SMS to your saved emergency contacts
- **Voice Feedback** — ElevenLabs TTS reads verification results aloud after each scan

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native + Expo (SDK 54), Expo Router |
| Language | TypeScript |
| Backend | Express.js + MongoDB (Mongoose) + JWT auth |
| Hosting | DigitalOcean App Platform |
| AI vision | Google Gemini (gemini-1.5-flash / gemini-2.5-flash) |
| TTS | ElevenLabs |

## BAC Calculation

BAC is estimated using the [Widmark formula](https://en.wikipedia.org/wiki/Blood_alcohol_content#Estimation_by_intake):

```
BAC = (alcohol_grams / (weight_kg × 1000 × r)) × 100 − (hours_elapsed × 0.015)
```

Where `r` = 0.73 for male, 0.66 for female. The estimate refreshes every minute and resets when you clear your drink list.

## AI Drink Verification

When you scan a drink, SipSafe sends the photo to Gemini and receives a structured response with:

- `match` — does the drink match what you said you ordered?
- `spoofingLikely` — is this a screen replay, printed image, or staged photo?
- `druggingLikely` — are there signs of powder, residue, or unusual cloudiness?
- `voiceMessage` — a short spoken result read aloud via ElevenLabs

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user profile |
| PATCH | `/api/auth/me` | Update profile |
| GET | `/api/drinks` | List available drink types |
| POST | `/api/drinklogs` | Log a drink |
| GET | `/api/drinklogs` | Get drink history |
| GET | `/api/drinklogs/stats` | Get drink stats |
| GET | `/api/drinklogs/analytics?range=1w` | Get bucketed analytics |
| POST | `/api/alerts/emergency-sms` | Send emergency SMS |
| POST | `/api/identifyDrink` | Identify drink from photo |
