export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { image } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) return res.status(500).json({ error: 'مفتاح API غير معرف في Vercel' });

    try {
        // إنشاء طلب ترميم الوجوه والصور
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
                "Prefer": "respond-async"
            },
            body: JSON.stringify({
                version: "92836086e3c34846f513811502455e76470d041130e1357b9f08625e2e8e7a07",
                input: {
                    img: image,
                    version: "v1.4",
                    scale: 2
                }
            })
        });

        const data = await response.json();

        if (data.error) return res.status(400).json({ error: data.error });

        // الانتظار السريع لاستلام الصورة المرممة
        let statusUrl = data.urls.get;
        let prediction = data;

        for (let i = 0; i < 25; i++) {
            if (prediction.status === "succeeded") {
                return res.status(200).json({ output: prediction.output });
            }
            if (prediction.status === "failed") {
                return res.status(500).json({ error: "فشلت معالجة الصورة" });
            }
            await new Promise(r => setTimeout(r, 1000));
            const check = await fetch(statusUrl, {
                headers: { "Authorization": `Token ${token}` }
            });
            prediction = await check.json();
        }

        return res.status(504).json({ error: "استغرق التعديل وقتاً أطول من المتوقع، حاول مجدداً" });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
