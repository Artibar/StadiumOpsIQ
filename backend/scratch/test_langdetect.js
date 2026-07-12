import langdetect from 'langdetect';

try {
  const result = langdetect.detect("यह एक परीक्षण है");
  console.log("Result:", typeof result, result);
} catch (e) {
  console.error("Error:", e);
}
