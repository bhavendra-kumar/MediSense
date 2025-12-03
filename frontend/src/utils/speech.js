// Shared speech utility for Chat, Reports, Dermatology
export const getVoiceLangCode = (lang) => {
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'ta':
      return 'ta-IN';
    case 'te':
      return 'te-IN';
    case 'bn':
      return 'bn-IN';
    case 'kn':
      return 'kn-IN';
    case 'ml':
      return 'ml-IN';
    case 'pa':
      return 'pa-IN';
    case 'gu':
      return 'gu-IN';
    case 'mr':
      return 'mr-IN';
    case 'or':
      return 'or-IN';
    default:
      return 'en-IN';
  }
};

export const speakText = (text, language = 'en') => {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

  const langCode = getVoiceLangCode(language);
  const voices = window.speechSynthesis.getVoices();

  let voice =
    voices.find((v) => v.lang === langCode) ||
    voices.find((v) => v.lang.startsWith(langCode.split('-')[0])) ||
    voices[0];

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
};
