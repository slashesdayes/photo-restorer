export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { image } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        return res.status(500).json({ error: 'API token not configured' });
    }

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
        
        // إذا تمت المعالجة فوراً أو إرجاع رابط
        if (data.output) {
            return res.status(200).json({ output: data.output });
        } else if (data.urls && data.urls.get) {
            // انتظار النتيجة إذا كانت تأخذ ثواني
            let prediction = data;
            while (prediction.status !== "succeeded" && prediction.status !== "failed") {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const checkRes = await fetch(prediction.urls.get, {
                    headers: { "Authorization": `Token ${token}` }
                });
                prediction = await checkRes.json();
            }
            if (prediction.status === "succeeded") {
                return res.status(200).json({ output: prediction.output });
            }
        }
        
        return res.status(500).json({ error: 'Failed to process image' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
