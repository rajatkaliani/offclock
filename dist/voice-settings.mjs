// Shared by local generation and build verification. No runtime model is shipped.
export const VOICE_SETTINGS = {
  revision:'chatterbox-v1',
  model:'ResembleAI/chatterbox',
  exaggeration:0.55,
  cfgWeight:0.45,
  bitrate:'128k',
  mastering:'loudnorm-I-18-TP-1.5-LRA-9-v1',
};
// guest.voice names the character's reference recording in art/voice-references/.
export function voiceSignature(guest,text) {
  return JSON.stringify({...VOICE_SETTINGS,voice:guest.voice,text});
}
