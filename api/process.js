export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { image } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) return res.status(500).json({ error: 'مفتاح API غير معرف في Vercel' });

    try {
        // استخدام النموذج الرسمي الشغال المضمون لـ CodeFormer
        const response = await fetch("https://api.replicate.com/v1/models/sczhou/codeformer/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input: {
                    image: image,
                    codeformer_fidelity: 0.7,
                    background_enhance: true,
                    face_upsample: true,
                    upscale: 2
                }
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            return res.status(400).json({ error: data.error || data.detail || 'خطأ في الاتصال بالنموذج' });
        }

        // انتطارات قصيرة للحصول على الصورة المرممة
        let prediction = data;
        for (let i = 0; i < 30; i++) {
            if (prediction.status === "succeeded") {
                return res.status(200).json({ output: prediction.output });
            }
            if (prediction.status === "failed") {
                return res.status(500).json({ error: prediction.error || "فشلت العملية" });
            }
            await new Promise(r => setTimeout(r, 1000));
            
            const check = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            prediction = await check.json();
        }

        return res.status(504).json({ error: "انتهت المهلة، حاول مجدداً" });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
