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
        // استخدام نموذج CodeFormer الممتاز والموثوق لترميم الوجوه والصور القديمة
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                version: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db731439075d496e9",
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

        if (data.error) {
            return res.status(400).json({ error: data.error });
        }

        // الاستعلام للحصول على الصورة بعد تجهيزها
        let prediction = data;
        while (prediction.status !== "succeeded" && prediction.status !== "failed") {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            prediction = await checkRes.json();
        }

        if (prediction.status === "succeeded") {
            return res.status(200).json({ output: prediction.output });
        } else {
            return res.status(500).json({ error: 'Processing failed' });
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
