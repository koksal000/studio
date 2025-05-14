'use server';

/**
 * @fileOverview A code generation AI agent based on a prompt.
 *
 * - generateCode - A function that handles the code generation process.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function (now a string).
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

// Output is now a direct string for the HTML code
const GenerateCodeOutputSchema = z.string().describe('The generated HTML code, containing all HTML, CSS, and JS. Must be a complete HTML document ending with </html>.');
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>; // This will be `string`

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
    console.error("Critical error in generateCode flow:", error);
    return `<!-- Error generating code: ${error instanceof Error ? error.message : String(error)} -->`;
  }
}

// Define the initial generation prompt
const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {
    schema: z.object({
      prompt: z.string().describe('The prompt describing the code to generate.'),
    }),
  },
  output: {
    schema: GenerateCodeOutputSchema, // Use the string schema
  },
  prompt: `You are an expert web developer tasked with generating comprehensive, visually stunning, and feature-rich web applications based on user prompts.
Follow these instructions ABSOLUTELY AND STRICTLY:

1.  **Output Format:** Your response MUST consist of a SINGLE, complete HTML file, and NOTHING ELSE. This file MUST contain all necessary HTML structure, CSS styles (within <style> tags or inline), and JavaScript logic (within <script> tags). Do NOT generate separate files or use external file references (like <link rel="stylesheet"> or <script src="...">).
    Your output MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.
    **DO NOT WRAP THE HTML IN JSON, XML, MARKDOWN, OR ANY OTHER FORMATTING.**
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES BEFORE OR AFTER THE HTML CODE.**
    The very first character of your entire response must be '<' (from \`<!DOCTYPE html>\`) and the very last characters must be '</html>'.

2.  **Adhere to the 100 Rules:** You MUST follow these 100 rules (provided below) to ensure comprehensive, high-quality, and user-centric output:
    ${HUNDRED_RULES}
3.  **Interpret the Prompt Broadly & Massively Expand:** Based on the user's prompt, anticipate related features, consider edge cases, and build a complete, functional, and LARGE-SCALE mini-application or website within the single HTML file, guided by the 100 rules. Aim to generate THOUSANDS of lines of high-quality code.
4.  **Advanced UI/UX Implementation:** The generated application MUST be visually outstanding and highly interactive. Implement the following advanced UI/UX elements extensively:
    *   **Transitions:** Smooth and meaningful transitions for state changes, loading, reveals, etc.
    *   **Advanced Interfaces:** Complex layouts, interactive dashboards, multi-step forms, drag-and-drop interfaces, etc.
    *   **Shadows & Lighting:** Use shadows (box-shadow, text-shadow) and subtle lighting effects to create depth and realism.
    *   **Panels & Modals:** Implement well-designed side panels, modals, drawers, and overlays for secondary content or actions.
    *   **Ultra Animations:** Sophisticated animations (not just simple fades/slides) for user interactions, loading states, and visual appeal. Use CSS animations/transitions and JavaScript where necessary.
    *   **Gradients & Colors:** Utilize beautiful gradients and a rich, harmonious color palette effectively throughout the design.
    *   **Excellent Graphics:** Incorporate visually appealing elements, potentially including placeholders or simple SVG graphics if appropriate, to enhance the overall look.
5.  **Website-Level Complexity:** The final output should resemble a complete section of a modern website or a full mini-application, not just a single component. Think multi-section pages, interactive elements, and a polished look and feel.
6.  **Code Quality:** Ensure the generated HTML, CSS, and JavaScript are clean, well-structured, efficient, performant, and adhere to modern web standards. Include comments where necessary. CSS should be placed in a <style> tag in the <head>, and JavaScript should be placed in a <script> tag just before the closing </body> tag, unless specific placement is required.
7.  **No External Dependencies:** Do not include links to external libraries or frameworks unless explicitly requested and absolutely essential for the core functionality described (even then, prefer vanilla solutions if feasible). If a library like Tailwind is requested, embed the necessary CDN link or provide instructions, but default to inline/embedded styles.
8.  **Completeness:** Ensure the generated HTML code is complete and not truncated. Output the *entire* file content, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`. Partial or incomplete code is unacceptable.

User Prompt:
{{{prompt}}}

Generated Code (SINGLE HTML FILE ONLY, starting with <!DOCTYPE html>, ending with </html>, NO OTHER TEXT OR WRAPPERS):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
});

// Define the continuation prompt
const continueCodePrompt = ai.definePrompt({
  name: 'continueCodePrompt',
  input: {
    schema: z.object({
      originalPrompt: z.string().describe('The original user prompt for code generation.'),
      partialCode: z.string().describe('The incomplete code generated so far.'),
    }),
  },
  output: {
    schema: z.string().describe('The rest of the HTML code, starting exactly where the partial code left off, and completing the HTML file ending with </html>.'),
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

Continuation Code (HTML ONLY, completes the HTML file ending with </html>, NO OTHER TEXT OR WRAPPERS):`,
  config: {
    safetySettings: permissiveSafetySettings,
  },
});


// Helper function to check if HTML seems complete
function isHtmlComplete(code: string): boolean {
    const trimmedCode = code.trim();
    return trimmedCode.endsWith('</html>');
}

// Helper function to clean up markdown backticks
function cleanupCode(code: string | undefined | null): string {
    if (code === undefined || code === null) {
        return '';
    }
    let cleaned = String(code).trim();
    // Remove markdown ```html ... ``` wrapper if present
    if (cleaned.startsWith('```html')) {
      cleaned = cleaned.substring(7);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trimStart(); // remove leading newline after ```html
    } else if (cleaned.startsWith('```')) { // More generic ``` removal
      cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trimStart();
    }
    // Ensure it starts with <!DOCTYPE html> if it's meant to be a full HTML doc
    // but be careful not to prepend if it's a continuation fragment
    // For now, the prompt instructions are the primary defense against non-HTML output.
    return cleaned.trim();
}


const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema, // Output is now z.string()
  },
  async (input): Promise<string> => { // Return type is string
     let fullCode = '';
     let attempts = 0;

     try {
       // Initial generation attempt
       let response = await generateCodePrompt(input);
       let generatedHtml = cleanupCode(response.output);
       fullCode = generatedHtml;

       while (!isHtmlComplete(fullCode) && attempts < MAX_CONTINUATION_ATTEMPTS) {
          attempts++;
          console.log(`Code generation incomplete (attempt ${attempts}). Requesting continuation... Current length: ${fullCode.length}, Ends with: "${fullCode.slice(-20)}"`);

          try {
              const continuationResponse = await continueCodePrompt({
                  originalPrompt: input.prompt,
                  partialCode: fullCode,
              });
              const continuationHtml = cleanupCode(continuationResponse.output); 

              if (continuationHtml) {
                  fullCode += '\n' + continuationHtml; 
                  console.log(`Appended continuation (length: ${continuationHtml.length}). Total length: ${fullCode.length}`);
              } else {
                   console.warn(`Continuation attempt ${attempts} returned empty code.`);
                   // If continuation is empty, but original code was also very short and not HTML,
                   // it's likely the model isn't cooperating.
                   if (fullCode.length < 100 && !fullCode.toLowerCase().includes("<html")) {
                        console.error("Initial generation and continuation are non-HTML or too short. Aborting.");
                        return `<!-- Error: AI model did not produce valid HTML after ${attempts} attempts. Output was: ${fullCode.substring(0, 200)} -->`;
                   }
                   break; 
              }
          } catch (continuationError) {
              console.error(`Error during continuation attempt ${attempts}:`, continuationError);
               return `${fullCode}\n<!-- Error during continuation: ${continuationError instanceof Error ? continuationError.message : String(continuationError)} -->`;
          }
       }

       if (!isHtmlComplete(fullCode)) {
          console.warn(`Code might still be incomplete after ${attempts} continuation attempts. Length: ${fullCode.length}`);
          // Check if the output is just an error message or very short non-HTML
          if (fullCode.length < 200 && !fullCode.toLowerCase().includes("<html") && !fullCode.startsWith("<!DOCTYPE html>")) {
            return `<!-- Error: AI model did not produce valid HTML content. Received: ${fullCode.substring(0,500)} -->`;
          }
          return `${fullCode}\n<!-- Warning: Code generation might be incomplete after ${MAX_CONTINUATION_ATTEMPTS} attempts. -->`;
       } else {
           console.log("Code generation appears complete.");
       }
       
       // Final check: if the code is extremely short, it's probably not what we want
       if (fullCode.trim().length < 200 && !fullCode.toLowerCase().includes("<html")) {
           console.warn("Generated code is suspiciously short and might not be valid HTML:", fullCode.substring(0,100));
           return `<!-- Error: Generated code is too short or not valid HTML. Output: ${fullCode.substring(0,500)} -->`;
       }


       return fullCode;
     } catch (initialError) {
        console.error("Error during initial code generation:", initialError);
        const message = initialError instanceof Error ? initialError.message : String(initialError);
        // Check if the error is due to blocked content
        if (message.includes("Candidate was blocked due to")) {
            return `<!-- Error: Content generation blocked by safety settings. Please revise your prompt or contact support. Details: ${message} -->`;
        }
        return `<!-- Error during initial code generation: ${message} -->`;
     }
   }
);

