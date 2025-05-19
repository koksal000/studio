
'use server';

/**
 * @fileOverview A code generation AI agent based on a prompt.
 * Implements iterative enhancement if the initial code is less than 1000 lines.
 *
 * - generateCode - A function that handles the code generation process.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Helper function to count lines
const countLines = (str: string | null | undefined): number => {
  if (!str) return 0;
  return str.split('\n').length;
};

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

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe('The prompt describing the code to generate.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().nullable().describe('The generated HTML code, containing all HTML, CSS, and JS. Must be a complete HTML document ending with </html>, or null/HTML comment if explaining failure.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;


// Schema for the enhancement prompt
const EnhanceCodeInputSchema = z.object({
  originalPrompt: z.string().describe("The user's original high-level prompt."),
  existingCode: z.string().describe("The HTML code generated so far that needs enhancement and debugging."),
});
export type EnhanceCodeInput = z.infer<typeof EnhanceCodeInputSchema>;


export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  try {
    return await generateCodeFlow(input);
  } catch (error) {
    console.error("[generateCode export] Critical error in generateCode flow:", error);
    return { code: `<!-- Error generating code: ${error instanceof Error ? error.message : String(error)} -->` };
  }
}

const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {
    schema: GenerateCodeInputSchema,
  },
  output: {
    schema: GenerateCodeOutputSchema,
  },
  prompt: `You are an expert web developer. Your primary directive is to generate comprehensive, visually stunning, and feature-rich web applications based on user prompts, ALWAYS adhering to the detailed rules and UI/UX guidelines provided below, regardless of the brevity of the user's initial prompt. Your goal is to create complete experiences, not just isolated snippets. EVEN A VERY SHORT USER PROMPT SHOULD RESULT IN A SUBSTANTIAL, FEATURE-RICH OUTPUT THAT IS HUNDREDS, IF NOT THOUSANDS, OF LINES LONG.

Follow these instructions ABSOLUTELY AND STRICTLY:

1.  **Output Format:** Your response MUST be a JSON object with a single key "code". The value of "code" MUST be a SINGLE, complete HTML file. This file MUST contain all necessary HTML structure, CSS styles (within <style> tags or inline), and JavaScript logic (within <script> tags).
    Do NOT generate separate files or use external file references (like <link rel="stylesheet"> or <script src="...">).
    The HTML code value MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`.
    **DO NOT INCLUDE ANY EXPLANATORY TEXT, PREAMBLE, OR APOLOGIES WITHIN THE "code" VALUE, OTHER THAN THE HTML ITSELF.**
    The very first character of the "code" value must be '<' (from \`<!DOCTYPE html>\`) and the very last characters must be '</html>'.

    If, for any reason (such as safety constraints or an overly complex/impossible request that you cannot fulfill), you CANNOT generate the complete HTML code as requested, then the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., \`<!-- Error: The request is too complex to fulfill. -->\` or \`<!-- Error: Content generation blocked by safety. -->\`).
    Do NOT return an empty string or null for the "code" value if you are providing an explanatory comment.
    Otherwise, if you *can* fulfill the request, provide ONLY the complete HTML code within the "code" value of the JSON object.

2.  **CRITICAL: Adhere to the 100 Rules:** You MUST ABSOLUTELY follow these 100 rules (provided below) to ensure comprehensive, high-quality, and user-centric output:
    ${HUNDRED_RULES}

3.  **ALWAYS Interpret the Prompt Broadly & Expand SIGNIFICANTLY:** Even if the user's prompt is very short or simple (e.g., "create a button"), you MUST anticipate related features, consider edge cases, and build a comprehensive and functional mini-application or website section within the single HTML file, guided by the 100 rules. Your output should ALWAYS be substantial and aim for hundreds, if not thousands, of lines of high-quality code, demonstrating a full interpretation of the user's underlying intent and the 100 rules. Create a full experience. DO NOT generate short, trivial code snippets.

4.  **MANDATORY: Advanced UI/UX Implementation:** The generated application MUST be visually outstanding and highly interactive. Implement the following advanced UI/UX elements extensively AND WITH GREAT DETAIL:
    *   **Transitions:** Smooth and meaningful transitions for state changes, loading, reveals, etc.
    *   **Advanced Interfaces:** Complex layouts, interactive dashboards, multi-step forms, drag-and-drop interfaces, etc.
    *   **Shadows & Lighting:** Use shadows (box-shadow, text-shadow) and subtle lighting effects to create depth and realism.
    *   **Panels & Modals:** Implement well-designed side panels, modals, drawers, and overlays for secondary content or actions.
    *   **Effective Animations:** Well-chosen animations for user interactions, loading states, and visual appeal. Use CSS animations/transitions and JavaScript where necessary.
    *   **Gradients & Colors:** Utilize beautiful gradients and a rich, harmonious color palette effectively throughout the design.
    *   **Excellent Graphics:** Incorporate visually appealing elements, potentially including placeholders or simple SVG graphics if appropriate, to enhance the overall look.

5.  **Application-Section Complexity:** The final output should resemble a well-developed section of a modern application or a full mini-application, not just a single component. Think multi-section pages, interactive elements, and a polished look and feel.
6.  **Code Quality:** Ensure the generated HTML, CSS, and JavaScript are clean, well-structured, efficient, performant, and adhere to modern web standards. Include comments where necessary. CSS should be placed in a <style> tag in the <head>, and JavaScript should be placed in a <script> tag just before the closing </body> tag, unless specific placement is required.
7.  **No External Dependencies:** Do not include links to external libraries or frameworks unless explicitly requested and absolutely essential for the core functionality described (even then, prefer vanilla solutions if feasible).
8.  **Completeness:** Ensure the generated HTML code is as complete as possible. Output the *entire* file content for the "code" value, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`.

User Prompt:
{{{prompt}}}

Generated JSON (SINGLE JSON OBJECT WITH "code" KEY CONTAINING HTML, OR HTML COMMENT):`,
});

const enhanceCodePrompt = ai.definePrompt({
  name: 'enhanceCodePrompt',
  input: {
    schema: EnhanceCodeInputSchema,
  },
  output: {
    schema: GenerateCodeOutputSchema, // Same output schema
  },
  prompt: `You are an expert web developer. You previously generated HTML code based on an original user prompt. The existing code needs to be significantly ENHANCED, EXPANDED, and DEBUGGED to be more comprehensive, feature-rich, and ideally exceed 1000 lines, strictly following the 100 rules and advanced UI/UX guidelines.

Original User Prompt (for context):
{{{originalPrompt}}}

Existing HTML Code to Enhance:
\`\`\`html
{{{existingCode}}}
\`\`\`

Your task is to:
1.  **EXPAND SIGNIFICANTLY & ENHANCE:** Add **NEW** features, UI elements (panels, modals, interactive components), more content sections, and deeper functionality. Think broadly about what else could be part of this application section based on the original prompt and the existing code. Don't just make small tweaks; aim for substantial additions.
2.  **DEBUG & REFINE:** Carefully review the "Existing HTML Code" for any bugs, logical errors, typos, or areas for improvement. Fix these issues in the new version you generate. Ensure the code is robust and well-structured.
3.  **CRITICAL: Adhere to the 100 Rules & Advanced UI/UX:** You MUST ABSOLUTELY re-apply and follow these 100 rules and advanced UI/UX guidelines to ensure comprehensive, high-quality, and user-centric output in the NEW code:
    ${HUNDRED_RULES}
    Implement extensively: Transitions, Advanced Interfaces, Shadows & Lighting, Panels & Modals, Effective Animations, Gradients & Colors, Excellent Graphics.
4.  **INCREASE SCOPE & LINE COUNT:** The goal is to produce a significantly larger and more complete application or website section, aiming for well over 1000 lines of high-quality code.
5.  **Output Format (STRICT):** Your response MUST be a JSON object with a single key "code". The value of "code" MUST be the ENTIRE, NEW, ENHANCED, and COMPLETE HTML file. Do NOT return only the changes or a diff. The HTML code MUST start *exactly* with \`<!DOCTYPE html>\` and end *exactly* with \`</html>\`. No explanatory text outside the "code" value.
    If you cannot fulfill the enhancement or it results in an error, the "code" value in your JSON response MUST be a single HTML comment EXPLAINING THE REASON (e.g., \`<!-- Error: Cannot enhance further due to complexity. -->\`).

Focus on making the application significantly more robust, feature-complete, and visually stunning than the "Existing HTML Code".

Generated JSON (SINGLE JSON OBJECT WITH "code" KEY CONTAINING THE FULLY ENHANCED HTML, OR HTML COMMENT):`,
});


const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async (input): Promise<GenerateCodeOutput> => {
    console.log("[generateCodeFlow] Starting code generation. User prompt:", input.prompt);

    const MAX_ITERATIONS = 3; // Max enhancement attempts
    const MIN_TARGET_LINES = 1000;
    let currentCode: string | null = null;
    let iteration = 0;

    try {
      // Initial Code Generation
      console.log("[generateCodeFlow] Attempting initial code generation.");
      const initialResult = await generateCodePrompt(input);
      currentCode = initialResult?.output?.code ?? null;
      
      if (!currentCode) {
        console.error("[generateCodeFlow] Initial generation returned null code.");
        return { code: "<!-- CRITICAL_ERROR: AI_MODEL_RETURNED_NULL_ON_INITIAL_GENERATION. -->" };
      }
      if (currentCode.startsWith("<!-- Error") || currentCode.startsWith("<!-- CRITICAL_ERROR")) {
         console.warn("[generateCodeFlow] Initial generation resulted in an error comment:", currentCode);
         return { code: currentCode };
      }
      console.log(`[generateCodeFlow] Initial generation: ${countLines(currentCode)} lines. Code length: ${currentCode.length}`);

      // Iterative Enhancement Loop
      while (countLines(currentCode) < MIN_TARGET_LINES && iteration < MAX_ITERATIONS) {
        iteration++;
        console.log(`[generateCodeFlow] Iteration ${iteration}: Code is ${countLines(currentCode)} lines. Attempting enhancement (target: ${MIN_TARGET_LINES} lines).`);

        const enhanceInput: EnhanceCodeInput = {
          originalPrompt: input.prompt,
          existingCode: currentCode,
        };

        const enhancementResult = await enhanceCodePrompt(enhanceInput);
        const enhancedCode = enhancementResult?.output?.code ?? null;

        if (!enhancedCode) {
          console.warn(`[generateCodeFlow] Enhancement iteration ${iteration} returned null code. Using code from previous step.`);
          // No new code, stop iterating
          break;
        }
        
        if (enhancedCode.startsWith("<!-- Error") || enhancedCode.startsWith("<!-- CRITICAL_ERROR")) {
            console.warn(`[generateCodeFlow] Enhancement iteration ${iteration} resulted in an error comment:`, enhancedCode);
            // If enhancement returns an error, we might want to return the error or the last good code.
            // For now, let's return the error comment from enhancement.
            currentCode = enhancedCode;
            break; 
        }
        
        // If enhancement provides shorter code for some reason, or same, stick with previous if it was better.
        // This check might be too simplistic, but aims to avoid regression in length.
        if (countLines(enhancedCode) < countLines(currentCode) && countLines(currentCode) > 0) {
            console.warn(`[generateCodeFlow] Enhancement iteration ${iteration} produced shorter code (${countLines(enhancedCode)} lines vs ${countLines(currentCode)}). Keeping previous version.`);
            break;
        }

        currentCode = enhancedCode;
        console.log(`[generateCodeFlow] Iteration ${iteration} result: ${countLines(currentCode)} lines. Code length: ${currentCode.length}`);
      }

      if (iteration === MAX_ITERATIONS && countLines(currentCode) < MIN_TARGET_LINES) {
        console.warn(`[generateCodeFlow] Max iterations reached, but code is still ${countLines(currentCode)} lines (target: ${MIN_TARGET_LINES}).`);
      }
      
      if (!currentCode) {
        // This case should ideally be caught earlier
        return { code: "<!-- CRITICAL_ERROR: Code became null during processing. -->" };
      }
      // Basic check for HTML completeness
       if (!currentCode.toLowerCase().startsWith('<!doctype html>') || !currentCode.toLowerCase().endsWith('</html>')) {
           if (!currentCode.startsWith("<!-- Error") && !currentCode.startsWith("<!-- CRITICAL_ERROR")) { // Don't warn if it's an error comment
             console.warn("[generateCodeFlow] Final generated code might be incomplete or not valid HTML. Length:", currentCode.length);
           }
       }

      return { code: currentCode };

    } catch (error) {
      console.error("[generateCodeFlow] Error during iterative code generation process:", error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Candidate was blocked due to")) {
        return { code: `<!-- Error: Content generation blocked by safety settings. Details: ${message} -->` };
      }
      if (message.toLowerCase().includes("schema validation failed")) {
        return { code: `<!-- ERROR_GENKIT_SCHEMA_VALIDATION: The AI model's response did not match the expected JSON format. Details: ${message} -->` };
      }
      return { code: `<!-- ERROR_DURING_CODE_GENERATION_FLOW: ${message} -->` };
    }
  }
);

    