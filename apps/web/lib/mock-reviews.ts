import { Review } from "./reviews";

export interface ReviewData {
  id: string;
  rating: number;
  date: string;
  comment?: string;
  language?: string; // 'en', 'es', 'de', 'fr', 'pl', etc.
  source: 'purchase' | 'survey' | 'support';
  verified: boolean;
  author: string; // "Verified Customer" or similar, no fake names
}

const SHORT_REVIEWS_EN = [
  "Works great.",
  "Easy setup, no issues.",
  "Cheap and fast.",
  "Good signal in Tokyo.",
  "Saved me a lot of money.",
  "Worked as expected.",
  "Internet was fast.",
  "Recommended.",
  "Quick activation.",
  "Very happy with this.",
  "Better than roaming.",
  "Instant connection.",
  "Simple to use.",
  "Good value.",
  "Everything went smooth.",
  "5 stars.",
  "Will buy again.",
  "Perfect for my trip.",
  "No problems at all.",
  "Seamless experience."
];

const SHORT_REVIEWS_ES = [
  "Funciona perfecto.",
  "Muy barato y rápido.",
  "Buena señal.",
  "Fácil de instalar.",
  "Recomendado.",
  "Todo bien.",
  "Excelente servicio.",
  "Internet rápido.",
  "Muy útil para viajar.",
  "Sin problemas."
];

const SHORT_REVIEWS_DE = [
  "Funktioniert super.",
  "Einfache Einrichtung.",
  "Günstig und gut.",
  "Guter Empfang.",
  "Sehr zufrieden.",
  "Alles bestens.",
  "Schnelles Internet.",
  "Empfehlenswert.",
  "Hat alles geklappt.",
  "Top Preis-Leistung."
];

const SHORT_REVIEWS_FR = [
  "Marche très bien.",
  "Installation facile.",
  "Pas cher et efficace.",
  "Bon réseau.",
  "Je recommande.",
  "Super pratique.",
  "Connexion rapide.",
  "Aucun problème.",
  "Parfait pour le voyage.",
  "Très satisfait."
];

const SHORT_REVIEWS_PL = [
  "Działa super.",
  "Łatwa instalacja.",
  "Tanie i dobre.",
  "Dobry zasięg.",
  "Polecam.",
  "Wszystko ok.",
  "Szybki internet.",
  "Bez problemów.",
  "Świetna sprawa.",
  "Jestem zadowolony."
];

const LONG_REVIEWS_EN = [
  "Activated instantly when I landed. The speed was consistently good throughout my trip. Much cheaper than my carrier's roaming plan.",
  "I was worried about setting it up, but the instructions were clear. Scanned the QR code and it just worked. Will definitely use again.",
  "Used this for a 2-week trip to Japan. Signal was strong even in rural areas. The unlimited data came in handy for maps and social media.",
  "Great alternative to physical SIM cards. No need to swap cards at the airport. Price is unbeatable compared to other providers I checked.",
  "Had a small issue with activation but support helped me sort it out quickly via email. After that, smooth sailing. Good customer service.",
  "Comparing this to Airalo, the prices are better here. Connection quality seems exactly the same since they use local networks.",
  "The data speed was decent. Not 5G everywhere but solid 4G which is enough for everything I needed. Google Maps loaded instantly.",
  "Highly recommend for anyone traveling. It's so much more convenient than hunting for a SIM card shop at the airport after a long flight."
];

const LONG_REVIEWS_ES = [
  "Se activó al instante cuando aterricé. La velocidad fue buena durante todo el viaje. Mucho más barato que el roaming de mi operador.",
  "Tenía dudas sobre la configuración, pero las instrucciones eran claras. Escaneé el código QR y funcionó. Definitivamente lo usaré de nuevo.",
  "Usé esto para un viaje de 2 semanas. La señal era fuerte incluso en áreas rurales. Los datos ilimitados fueron muy útiles.",
  "Gran alternativa a las tarjetas SIM físicas. No hay necesidad de cambiar tarjetas en el aeropuerto. El precio es inmejorable."
];

// Helper to get random item from array
const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Seeded random number generator to ensure consistent results across renders
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateReviews(count: number = 3240): ReviewData[] {
  const reviews: ReviewData[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Deterministic randomness based on index
    const rand = seededRandom(i); 
    
    // Distribution Logic
    // ~75% Star only
    // ~15% Short text
    // ~5% Long text
    // ~5% Low ratings (mostly star only or short)
    
    let rating = 5;
    let hasText = false;
    let text = "";
    let language = "en";
    
    // Determine Rating
    if (rand > 0.95) rating = 4;      // 5% 4 stars
    else if (rand > 0.98) rating = 3; // 2% 3 stars
    else if (rand > 0.99) rating = 1; // 1% 1 star (very rare)
    else rating = 5;                  // Most are 5 stars

    // Determine Type
    const typeRand = seededRandom(i + 1000);
    
    if (typeRand < 0.75) {
      // Star only (75%)
      hasText = false;
    } else if (typeRand < 0.90) {
      // Short text (15%)
      hasText = true;
      // Select language
      const langRand = seededRandom(i + 2000);
      if (langRand < 0.6) {
        language = "en";
        text = sample(SHORT_REVIEWS_EN);
      } else if (langRand < 0.7) {
        language = "es";
        text = sample(SHORT_REVIEWS_ES);
      } else if (langRand < 0.8) {
        language = "de";
        text = sample(SHORT_REVIEWS_DE);
      } else if (langRand < 0.9) {
        language = "fr";
        text = sample(SHORT_REVIEWS_FR);
      } else {
        language = "pl";
        text = sample(SHORT_REVIEWS_PL);
      }
    } else {
      // Long text (5-10%)
      hasText = true;
      // Mostly EN/ES for long ones in this mock
      if (seededRandom(i + 3000) < 0.8) {
        language = "en";
        text = sample(LONG_REVIEWS_EN);
      } else {
        language = "es";
        text = sample(LONG_REVIEWS_ES);
      }
    }

    // Override low ratings to have specific complaints sometimes, or just star only
    if (rating <= 3 && hasText) {
      text = language === "en" ? "Signal was okay but slow in some areas." : "Señal regular.";
    }

    // Date generation (spread over last 2 years)
    const daysBack = Math.floor(seededRandom(i + 4000) * 730);
    const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    reviews.push({
      id: `mock-${i}`,
      rating,
      date,
      comment: hasText ? text : undefined,
      language: hasText ? language : undefined,
      source: i % 10 === 0 ? 'support' : 'purchase', // 10% from support, rest purchase
      verified: true,
      author: "Verified Customer"
    });
  }

  // Sort by date (newest first)
  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

