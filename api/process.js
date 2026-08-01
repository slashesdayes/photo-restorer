export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { image } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) return res.status(500).json({ error: 'مفتاح API غير معرف في Vercel' });

    try {
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json"
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

        // في حال وجود خطأ من سيرفر Replicate
        if (!response.ok || data.error || !data.urls) {
            return res.status(400).json({ error: data.error || data.detail || 'فشل البدء في المعالجة' });
        }

        // الاستعلام بأمان
        const statusUrl = data.urls.get;
        let prediction = data;

        for (let i = 0; i < 30; i++) {
            if (prediction.status === "succeeded") {
                return res.status(200).json({ output: prediction.output });
            }
            if (prediction.status === "failed") {
                return res.status(500).json({ error: prediction.error || "فشلت عملية الترميم" });
            }
            await new Promise(r => setTimeout(r, 1000));
            
            const check = await fetch(statusUrl, {
                headers: { "Authorization": `Token ${token}` }
            });
            prediction = await check.json();
        }

        return res.status(504).json({ error: "انتهت المهلة، حاول مجدداً" });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
