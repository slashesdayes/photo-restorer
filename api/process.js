export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { image } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) return res.status(500).json({ error: 'مفتاح API غير معرف في Vercel' });

    try {
        // 1. رفع الصورة مؤقتاً للحصول على رابط مباشر تفهمه Replicate
        const uploadRes = await fetch("https://tmpfiles.org/api/v1/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: image })
        });
        const uploadData = await uploadRes.json();
        
        let imageUrl = image;
        if (uploadData && uploadData.data && uploadData.data.url) {
            imageUrl = uploadData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
        }

        // 2. إرسال الطلب للنموذج الرسمي GFPGAN لترميم الصور
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                version: "92836086e3c34846f513811502455e76470d041130e1357b9f08625e2e8e7a07",
                input: {
                    img: imageUrl,
                    version: "v1.4",
                    scale: 2
                }
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            return res.status(400).json({ error: data.error || data.detail || 'تعذر بدء المعالجة' });
        }

        // 3. انتظار النتيجة
        let prediction = data;
        for (let i = 0; i < 25; i++) {
            if (prediction.status === "succeeded") {
                return res.status(200).json({ output: prediction.output });
            }
            if (prediction.status === "failed") {
                return res.status(500).json({ error: prediction.error || "فشلت عملية الترميم" });
            }
            await new Promise(r => setTimeout(r, 1200));
            
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
