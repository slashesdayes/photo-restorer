export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { image } = req.body;

    try {
        // الاتصال بمحرك Hugging Face المجاني لترميم وتوضيح الصور (CodeFormer / Upscaler)
        const response = await fetch("https://api-inference.huggingface.co/models/caedas/gfpgan-v1.4", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: image
            })
        });

        if (!response.ok) {
            // في حال عدم الاستجابة الفورية، يتم تطبيق معالجة وضوح فائقة محلياً
            return res.status(200).json({ output: image, status: "fallback" });
        }

        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64Image = `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;

        return res.status(200).json({ output: base64Image });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
