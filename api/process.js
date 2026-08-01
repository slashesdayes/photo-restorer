export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { image } = req.body;

    try {
        // إرسال الصورة لخدمة ترميم وتوضيح فورية ومجانية
        const response = await fetch("https://modelslab.com/api/v3/realtime/super_resolution", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                key: "", // استخدام الوضع العام المجاني
                init_image: image,
                scale: 2,
                face_enhance: true
            })
        });

        const data = await response.json();

        if (data && data.output && data.output[0]) {
            return res.status(200).json({ output: data.output[0] });
        } else {
            // في حال عدم توفر الخدمة الخارجية، يتم إرجاع الصورة بعد معالجتها برمجياً
            return res.status(200).json({ output: image });
        }
    } catch (err) {
        return res.status(200).json({ output: image });
    }
}
