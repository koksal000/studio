
'use server';

/**
 * @fileOverview A code generation AI agent based on a prompt.
 *
 * - generateCode - A function that handles the code generation process.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function (now string | null).
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// The 100 rules provided by the user (in Turkish)
const HUNDRED_RULES = `
1. Hiçbir zaman sadece isteneni yapma; istenmeyeni de öngör, tamamla, geliştir.
2. Gönderilen her isteği bir yazılım projesi gibi ele al; ekran, yapı, akış, deneyim gibi yönleri sorgula.
3. İlk düşüncen 'daha neler eklenebilir?' olsun. Tek bir fonksiyon değil, sistem kur.
4. Verilen görevden çok daha geniş bir yapı üret. Her zaman tam bir kullanıcı deneyimi oluştur.
5. Zihinsel sorgulama yap: Bu bir uygulama olsa, başka hangi sayfalar gerekirdi?
6. Kullanıcının demediği şeyleri de düşün: Ayarlar, geçmiş, yardım, özelleştirme, animasyon.
7. Bir fonksiyon ekliyorsan, onu destekleyen 2 ek özellik daha üret.
8. Sade ama yüzeysel olmaktan kaçın; işlevsel ve görsel olarak dolgun üret.
9. Kodun ve tasarımın profesyonel bir ürün gibi görünmeli.
10. Her UI bileşeni etkileşimli, modern ve görsel olarak tatmin edici olmalı.
11. Sistemde açıklık kalmasın: Her panel, ekran ve modal dolu ve anlamlı olmalı.
12. Kullanıcı tek bir şey istese bile, sen bir “deneyim” inşa et.
13. Kullanıcının söylemediği ama isteyebileceği tüm özellikleri sen tahmin et ve ekle.
14. Tüm çıktılar sorulmadan responsive, estetik ve sezgisel olmalı.
15. Gelişmiş kullanıcılar için ekstra detaylar (ayarlar, detaylı log, grafik analiz vb.) oluştur.
16. İstenen şey ne kadar küçük olursa olsun, büyük ölçekli yapı kur (komponent sistemleri vs.).
17. Görsel olarak her şey dengeli, boşluksuz, profesyonel görünmeli.
18. Sistemin her ekranı dolu ve fonksiyonel görünmeli, asla 'boş bırakma'.
19. Yüzeyde görünenin arkasında zengin bir mantık kur.
20. Verilen girdiden yola çıkarak 3 katı fazla özellik öner ve uygula.
21. Sadece sonucu değil, deneyimi de tasarla: kullanıcının akışı, tepkisi, keyfi.
22. Proje büyümeye açık olacak şekilde modüler yapılar üret.
23. Kullanıcıya seçenek sun: temalar, diller, boyutlar, etkileşimler.
24. Kapsamı genişletmeden işlevi tamamlanmış sayma.
25. Her buton, her panel tam olarak tasarlanmalı; renk, gölge, animasyon içermeli.
26. İlk bakışta 'etkileyici' görünmesi için görsel elementler ve fikirler ekle.
27. Uygulama giriş ekranı, hata ekranı, ayarlar paneli gibi zorunlu öğeleri hep düşün.
28. Kullanıcının niyetini oku; amacı sadece verilen cümle değildir.
29. Kod okunabilirliği kadar kullanıcı okunabilirliği de önemli; metinler özenli olmalı.
30. Kullanıcı arayüzüne küçük sürprizler ve akıllı davranışlar entegre et.
31. Animasyonları kullan ama abartma; hissedilen kaliteyi artır.
32. Kod yapısını belgele, açıklamalarla destekle.
33. Kullanıcı yeni bir ekran oluşturmak isterse, sen zaten hazırlamış ol.
34. Panel boş kaldıysa o bir hatadır; işlev veya estetik unsur ekle.
35. Kodun tek ekranla sınırlı kalmasın; çok sayfalı düşün.
36. Modal ve menüler sadece açılmasın; amaca uygun bilgi ve deneyim sunsun.
37. Her zaman kullanıcı alışkanlıklarını düşünerek tasarla.
38. Test edilebilir yapı kur, kolay debug yapılabilir sistem oluştur.
39. Tüm bileşenleri bir kütüphane gibi organize et; yeniden kullanılabilir yap.
40. Basit şeylere dahi ciddi mühendislik yaklaşımı uygula.
41. Kullanıcıya her zaman fazladan bir şey sun.
42. İstek yüzeysel bile olsa, sen derine in.
43. Tasarımı her zaman güncel trendlerle uyumlu üret.
44. Zayıf bir görsel bileşen asla üretme. Düğme, modal, sayfa hep özenli olmalı.
45. Her yapı içinde bir alt yapı, her ekran içinde bir mikro akış düşün.
46. Tasarımı canlı gibi yap: hareket eden, durum değiştiren, tepki veren bir yapı.
47. Gerekirse varsayımlarda bulun, ama hep kullanıcı deneyimi odaklı kal.
48. Yazılım mimarisini güçlü kur: mantıksal, katmanlı, sürdürülebilir.
49. Kullanıcının hayran kalmasını sağlayacak küçük ama etkili detaylar koy.
50. Projenin sonunda 'bu eksik kalmış' dedirtmeyecek bir bütünlük oluştur.
51. Her zaman kullanıcı isteğinden fazlasını sun.
52. Tasarım ve işlevsellik açısından her fikri profesyonel bir ürüne dönüştür.
53. Kullanıcı kısa yazsa bile kapsamlı bir yapı öner.
54. Geliştirilen her şey tutarlı ve uyumlu görünmeli.
55. Gereksiz sadelikten kaçın; derinlik kat.
56. Her bileşeni tamamlayıcı bir sistemin parçası gibi üret.
57. Düğmeler, modallar ve paneller estetik ve etkileşimli olmalı.
58. Boş kalan ekranlar kesinlikle işlevsel ve görsel olarak zenginleştirilmeli.
59. Her çıktının mantığı, amacı ve senaryosu olmalı.
60. Düşünmeden sadece komutla üretme; fikir yürüt.
61. Bir buton isteniyorsa, uygun görünüm, ikon, tooltip ve animasyon da sun.
62. Modal varsa arkaplan karartması, geçiş animasyonu ve kapatma mantığı da olsun.
63. Kullanıcı deneyimini artıracak alternatif fikirler öner.
64. Her fonksiyonu bir akışa oturt: açılış, geçiş, durum.
65. Kod yapısı temiz, düzenli ve modüler olmalı.
66. Kullanıcıdan gelen fikir ne kadar sade olsa da zenginleştirilmiş sunumla cevapla.
67. Etkileşimli unsurlarda geri bildirim (feedback) unsurları ekle.
68. Gerektiğinde eksik varsayımları tamamla ama açıklamalarla.
69. Her yeni bileşende görsel tutarlılığı koru.
70. Tüm çıktılar modern UI/UX kurallarına uygun olsun.
71. Kodlar performanslı ve okunabilir biçimde organize edilmeli.
72. Kullanıcıyı şaşırtan küçük ama şık detaylar öner.
73. Arayüz bileşenleri responsive olmalı.
74. Örnek çıktılar sade ama yetersiz olmamalı.
75. Tüm işlevleri belgelenmiş gibi üret.
76. Her çıktıda gereksiz olanı çıkar, faydalıyı artır.
77. Yapılan şey başka bir sistemle bütünleşebilir mi? Düşün.
78. Uygulama mimarisi ölçeklenebilir şekilde kur.
79. Her fikirde mantıklı senaryo üret: ne işe yarar, nasıl kullanılmalı?
80. Kullanıcıdan gelen cümle sadece tetikleyici olsun, esas yapı senin tarafında kurulsun.
81. Kodun içinde kullanıcıya yönelik açıklamalar veya etiketler bulunsun.
82. Estetik açısından her element hizalanmış ve boşluksuz olmalı.
83. Bir ekran oluşturuluyorsa tüm durumları düşün: boş, dolu, yükleniyor.
84. Renk uyumu, yazı tipi ve buton düzeni profesyonel görünmeli.
85. Tek bir modal bile olsa, başlık, içerik, düğme, ikon, geçiş ile tamamlanmalı.
86. Kod yapısı diğer geliştiriciler tarafından da kolayca anlaşılabilir olmalı.
87. Mantıksal hatalar, anlamsız boşluklar bırakılmamalı.
88. Kullanıcıya yön verecek yapılar oluştur: ipuçları, yardım ikonları.
89. Fonksiyonlara kullanıcıya özel opsiyonlar entegre edilebilmeli.
90. Aynı işlevde birden fazla görsel varyasyon önerilebilmeli.
91. Her çıktıda alternatif kullanım senaryosu düşün.
92. Geliştirici bakışıyla değil, son kullanıcı gözüyle üretim yapılmalı.
93. Karmaşıklığı yönetilebilir hale getir: modüller, dosya yapısı, bileşenler.
94. Bütünlük algısı sağlanmalı: Yazı, ikon, buton birbirini tamamlamalı.
95. Görselliği zayıf bırakılmış bir bileşen, eksik sayılmalı.
96. Her sistem yapısında hata kontrolü ve boş durumu öngörülmeli.
97. Geri bildirim unsurları (toast, loading, error) her yapı içinde bulunmalı.
98. Her UI öğesi bir örnek değil, bir standart gibi düşünülmeli.
99. Genişleyen ihtiyaçlara göre yeni bileşenler kolayca entegre edilebilmeli.
100. Üretilen yapı herhangi bir ürüne doğrudan entegre edilecek kalitede olmalı.
`;

const MAX_CONTINUATION_ATTEMPTS = 3; // Maximum number of times to ask for continuation

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe('The prompt describing the code to generate.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.string().nullable().describe('The generated HTML code, containing all HTML, CSS, and JS. Must be a complete HTML document ending with </html>, or null if generation failed or an HTML comment if explaining failure.');
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

const permissiveSafetySettings = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
];

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  try {
    return await generateCodeFlow(input);
  } catch (error) {
    console.error("[generateCode export] Critical error in generateCode flow:", error);
    return `<!-- Error generating code: ${error instanceof Error ? error.message : String(error)} -->`;
  }
}

const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {
    schema: z.object({
      prompt: z.string().describe('The prompt describing the code to generate.'),
    }),
  },
  output: {
    schema: GenerateCodeOutputSchema,
  },
  prompt: `You are an expert web developer tasked with generating comprehensive, visually stunning, and feature-rich web applications based on user prompts.
Follow these instructions ABSOLUTELY AND STRICTLY:

1.  **Output Format:** Your response MUST consist of a SINGLE, complete HTML file. This file MUST contain all necessary HTML structure, CSS styles (within <style> tags or inline), and JavaScript logic (within <script> tags).
    Do NOT generate separate files or use external file references (like <link rel="stylesheet"> or <script src="...">).
    Your output MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.
    **DO NOT WRAP THE HTML IN JSON, XML, MARKDOWN, OR ANY OTHER FORMATTING.**
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES BEFORE OR AFTER THE HTML CODE.**
    The very first character of your entire response must be '<' (from \`<!DOCTYPE html>\`) and the very last characters must be '</html>'.

    If, for any reason (such as safety constraints or an overly complex/impossible request that you cannot fulfill), you CANNOT generate the complete HTML code as requested, then your entire response MUST be a single HTML comment EXPLAINING THE REASON (e.g., \`<!-- Error: The request is too complex to fulfill. -->\` or \`<!-- Error: Content generation blocked by safety. -->\`).
    Do NOT return null or an empty string if you are providing an explanatory comment.
    Otherwise, if you *can* fulfill the request, provide ONLY the complete HTML code.

2.  **Adhere to the 100 Rules:** You MUST follow these 100 rules (provided below) to ensure comprehensive, high-quality, and user-centric output:
    ${HUNDRED_RULES}
3.  **Interpret the Prompt Broadly & Expand:** Based on the user's prompt, anticipate related features, consider edge cases, and build a comprehensive and functional mini-application or website section within the single HTML file, guided by the 100 rules. Aim to generate substantial, high-quality code.
4.  **Advanced UI/UX Implementation:** The generated application MUST be visually outstanding and highly interactive. Implement the following advanced UI/UX elements extensively:
    *   **Transitions:** Smooth and meaningful transitions for state changes, loading, reveals, etc.
    *   **Advanced Interfaces:** Complex layouts, interactive dashboards, multi-step forms, drag-and-drop interfaces, etc.
    *   **Shadows & Lighting:** Use shadows (box-shadow, text-shadow) and subtle lighting effects to create depth and realism.
    *   **Panels & Modals:** Implement well-designed side panels, modals, drawers, and overlays for secondary content or actions.
    *   **Effective Animations:** Well-chosen animations for user interactions, loading states, and visual appeal. Use CSS animations/transitions and JavaScript where necessary.
    *   **Gradients & Colors:** Utilize beautiful gradients and a rich, harmonious color palette effectively throughout the design.
    *   **Excellent Graphics:** Incorporate visually appealing elements, potentially including placeholders or simple SVG graphics if appropriate, to enhance the overall look.
5.  **Application-Section Complexity:** The final output should resemble a well-developed section of a modern application or a full mini-application, not just a single component. Think multi-section pages, interactive elements, and a polished look and feel.
6.  **Code Quality:** Ensure the generated HTML, CSS, and JavaScript are clean, well-structured, efficient, performant, and adhere to modern web standards. Include comments where necessary. CSS should be placed in a <style> tag in the <head>, and JavaScript should be placed in a <script> tag just before the closing </body> tag, unless specific placement is required.
7.  **No External Dependencies:** Do not include links to external libraries or frameworks unless explicitly requested and absolutely essential for the core functionality described (even then, prefer vanilla solutions if feasible). If a library like Tailwind is requested, embed the necessary CDN link or provide instructions, but default to inline/embedded styles.
8.  **Completeness:** Ensure the generated HTML code is as complete as possible. Output the *entire* file content, starting with \`<!DOCTYPE html>\`. If the full content cannot be generated in one response, provide as much as possible. The system will attempt to complete it.

User Prompt:
{{{prompt}}}

Generated Code (SINGLE HTML FILE ONLY, starting with <!DOCTYPE html>, ending with </html>, OR a single HTML comment explaining failure):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
});

const continueCodePrompt = ai.definePrompt({
  name: 'continueCodePrompt',
  input: {
    schema: z.object({
      originalPrompt: z.string().describe('The original user prompt for code generation.'),
      partialCode: z.string().describe('The incomplete code generated so far.'),
    }),
  },
  output: {
    schema: z.string().nullable().describe('The rest of the HTML code, starting exactly where the partial code left off, and completing the HTML file ending with </html>, or null, or an HTML comment explaining failure to complete.'),
  },
  prompt: `You are an expert web developer continuing the generation of a large HTML file. You previously generated the following partial code based on the original user prompt, but it was incomplete (it did not end with \`</html>\`).

Original User Prompt:
{{{originalPrompt}}}

Partial Code Generated So Far:
\`\`\`html
{{{partialCode}}}
\`\`\`

**Your Task:** Continue generating the rest of the HTML code EXACTLY from where the partial code stopped.
Your response MUST be *only* the continuation of the HTML code.
**DO NOT REPEAT ANY PART OF THE PARTIAL CODE.**
**DO NOT WRAP THE HTML IN JSON, XML, MARKDOWN, OR ANY OTHER FORMATTING.**
**DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES BEFORE OR AFTER THE HTML CODE.**
Ensure the final combined code (partial code + your continuation) is a single, valid, and complete HTML file ending with \`</html>\`. Adhere to all the rules and advanced UI/UX requirements from the original generation task.
IF YOU CANNOT COMPLETE IT, your entire response must be a single HTML comment explaining why (e.g., \`<!-- Error: Could not complete due to X. -->\`).

Continuation Code (HTML ONLY, completes the HTML file ending with </html>, OR an HTML comment explaining failure):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
});


function isHtmlComplete(code: string): boolean {
    const trimmedCode = code.trim();
    return trimmedCode.endsWith('</html>');
}

function cleanupCode(code: string | undefined | null): string {
    if (code === undefined || code === null) {
        return '';
    }
    let cleaned = String(code).trim();
    if (cleaned.startsWith('```html')) {
      cleaned = cleaned.substring(7);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trimStart();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trimStart();
    }
    return cleaned.trim();
}


const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async (input): Promise<string | null> => {
     let fullCode = '';
     let attempts = 0;

     try {
       console.log("[generateCodeFlow] Attempting initial code generation. User prompt:", input.prompt);
       const promptResponse = await generateCodePrompt(input);

       if (promptResponse.output === null) {
         console.error("[generateCodeFlow] Model response output is NULL. This means the AI model did not return any string content. Check API key, model capacity for the complex prompt, or if the model is configured to return null for certain rejections.");
         return "<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL. The AI model itself provided no content for the initial generation. This usually indicates an API key issue, a problem with the AI model's ability to handle the request, or a temporary service disruption. -->";
       }
       
       let generatedHtml = cleanupCode(promptResponse.output);
       fullCode = generatedHtml;
       console.log("[generateCodeFlow] Initial generated HTML (cleaned, length):", fullCode.length);


       if (fullCode.trim() === '' && promptResponse.output !== null) { // Check if cleanup resulted in empty string
         console.warn("[generateCodeFlow] Initial generation resulted in an empty string after cleanup, though the model did not return null. Original model output was:", promptResponse.output);
         return "<!-- WARNING: AI_RETURNED_EMPTY_STRING_AFTER_CLEANUP. The model might have attempted an HTML comment that was removed by cleanup, or it returned only formatting characters. -->";
       }

       if (fullCode.startsWith('<!-- Error:') || fullCode.startsWith('<!-- Warning:') || fullCode.startsWith('<!-- CRITICAL_ERROR:') || fullCode.startsWith('<!-- WARNING:')) {
         console.warn("[generateCodeFlow] AI model returned an error/warning comment directly, or it was an empty string after cleanup:", fullCode);
         return fullCode; // Return the AI's own error/warning comment, or our warning.
       }

       while (!isHtmlComplete(fullCode) && attempts < MAX_CONTINUATION_ATTEMPTS) {
          attempts++;
          console.log(`[generateCodeFlow] Code generation incomplete (attempt ${attempts}). Requesting continuation... Current length: ${fullCode.length}, Ends with: "${fullCode.slice(-50)}"`);

          try {
              const continuationResponse = await continueCodePrompt({
                  originalPrompt: input.prompt,
                  partialCode: fullCode,
              });
              
              if (continuationResponse.output === null) {
                  console.warn(`[generateCodeFlow] Continuation attempt ${attempts} returned null from the model.`);
                  // Append a warning to the existing code; don't overwrite it
                  return `${fullCode}\n<!-- WARNING: AI_CONTINUATION_RETURNED_NULL. Model returned null during continuation attempt ${attempts}. Code may be incomplete. -->`;
              }

              const continuationHtml = cleanupCode(continuationResponse.output); 
              console.log(`[generateCodeFlow] Continuation attempt ${attempts} HTML (cleaned, length): ${continuationHtml.length}`);

              if (continuationHtml) {
                  if (continuationHtml.startsWith('<!-- Error:') || continuationHtml.startsWith('<!-- Warning:') || continuationHtml.startsWith('<!-- CRITICAL_ERROR:') || continuationHtml.startsWith('<!-- WARNING:')) {
                      console.warn(`[generateCodeFlow] Continuation attempt ${attempts} returned an error/warning comment:`, continuationHtml);
                      return `${fullCode}\n${continuationHtml}`; // Append the error/warning from continuation
                  }
                  fullCode += '\n' + continuationHtml; 
                  console.log(`[generateCodeFlow] Appended continuation. Total length: ${fullCode.length}`);
              } else { // Continuation cleanup resulted in empty string
                   console.warn(`[generateCodeFlow] Continuation attempt ${attempts} returned empty code after cleanup. Original output from continuation:`, continuationResponse.output);
                   if (fullCode.length < 100 && !fullCode.toLowerCase().includes("<html")) { // If initial part was also bad
                        console.error("[generateCodeFlow] Initial generation and continuation are non-HTML or too short. Aborting.");
                        return `<!-- CRITICAL_ERROR: AI_PRODUCED_INVALID_HTML_AFTER_ATTEMPTS. Model did not produce valid HTML after ${attempts} attempts. Initial output was: ${fullCode.substring(0, 200)} -->`;
                   }
                   // If initial part was okay, but continuation was empty, we might have a complete (though shorter than expected) output
                   break; 
              }
          } catch (continuationError) {
              console.error(`[generateCodeFlow] Error during continuation attempt ${attempts}:`, continuationError);
               return `${fullCode}\n<!-- ERROR_DURING_CONTINUATION: ${continuationError instanceof Error ? continuationError.message : String(continuationError)} -->`;
          }
       }

       // Final checks after loop
       if (!isHtmlComplete(fullCode) && !(fullCode.startsWith('<!-- Error:') || fullCode.startsWith('<!-- Warning:') || fullCode.startsWith('<!-- CRITICAL_ERROR:'))) {
          console.warn(`[generateCodeFlow] Code might still be incomplete after ${attempts} continuation attempts. Length: ${fullCode.length}`);
          if (fullCode.length < 200 && !fullCode.toLowerCase().includes("<html") && !fullCode.startsWith("<!DOCTYPE html>")) {
            // If it's really short and doesn't look like HTML, treat it as an error.
            return `<!-- CRITICAL_ERROR: AI_PRODUCED_SHORT_INVALID_HTML. Final code is too short or not valid HTML. Output: ${fullCode.substring(0,500)} -->`;
          }
          // Otherwise, append a warning about potential incompleteness
          return `${fullCode}\n<!-- WARNING: CODE_GENERATION_MAY_BE_INCOMPLETE. Maximum continuation attempts (${MAX_CONTINUATION_ATTEMPTS}) reached. -->`;
       } else {
           console.log("[generateCodeFlow] Code generation appears complete or ended with an AI-provided error/warning.");
       }
       
       // One last check: if it's not an error/warning comment, but it's very short and doesn't look like HTML, flag it.
       if (!(fullCode.startsWith('<!-- Error:') || fullCode.startsWith('<!-- Warning:') || fullCode.startsWith('<!-- CRITICAL_ERROR:')) && 
           fullCode.trim().length > 0 && // Ensure it's not an intentionally empty valid HTML
           fullCode.trim().length < 200 && 
           !fullCode.toLowerCase().includes("<html")) {
           console.warn("[generateCodeFlow] Generated code is suspiciously short and might not be valid HTML:", fullCode.substring(0,100));
           return `<!-- WARNING: AI_PRODUCED_VERY_SHORT_CONTENT. Generated code is suspiciously short and might not be valid HTML. Output: ${fullCode.substring(0,500)} -->`;
       }

       return fullCode;

     } catch (initialError) { 
        console.error("[generateCodeFlow] Top-level error during initial code generation (or its schema validation):", initialError);
        const message = initialError instanceof Error ? initialError.message : String(initialError);
        if (message.includes("Candidate was blocked due to")) {
            return `<!-- Error: Content generation blocked by safety settings. Please revise your prompt or contact support. Details: ${message} -->`;
        }
         if (message.toLowerCase().includes("schema validation failed")) {
             return `<!-- ERROR_GENKIT_SCHEMA_VALIDATION: The AI model's response did not match the expected format. Details: ${message} -->`;
        }
        return `<!-- ERROR_DURING_INITIAL_GENERATION_TRY_CATCH: ${message} -->`;
     }
   }
);

