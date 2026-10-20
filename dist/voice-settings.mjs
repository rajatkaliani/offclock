// Shared by local generation and build verification. No runtime model is shipped.
export const VOICE_SETTINGS = {
  revision:'natural-v2',
  model:'onnx-community/Kokoro-82M-v1.0-ONNX',
  precision:'fp32',
  bitrate:'128k',
  mastering:'loudnorm-I-18-TP-1.5-LRA-9-v1',
};
export function voiceSignature(guest,text) {
  return JSON.stringify({...VOICE_SETTINGS,voice:guest.voice,speed:guest.pace,text});
}
