const fs = require('fs');
let c = fs.readFileSync('translations.js', 'utf8');

// Find the broken escaped line and replace with clean multi-line block
const broken = /      steps: \[\\n.*?\\n    \}\\n  \},/s;

const fixed = `      steps: [
        { num: "01", title: "أرسل لنا تفاصيل حسابك عبر واتساب" },
        { num: "02", title: "نراجع حالتك ونخبرك إن كان بإمكاننا المساعدة" },
        { num: "03", title: "نعمل على الاسترجاع ونوافيك بالمستجدات" }
      ]
    },
    creators: {
      badge: "التعاونات",
      title: "المؤثرون الذين تعاونا معهم",
      subtitle: "نفتخر بالتعاون مع صناع محتوى وشخصيات معروفة في المغرب والعالم العربي.",
      altText: "صورة {name} على {platform}",
      openLabel: "فتح ملف {name} على {platform}",
      followersLabel: "متابع",
      viewMore: "عرض المزيد",
      viewLess: "عرض أقل",
      ctaTitle: "هل أنت صانع محتوى؟ لنتعاون معاً.",
      ctaBtn: "تواصل معنا عبر واتساب"
    }
  },`;

if (broken.test(c)) {
  c = c.replace(broken, fixed);
  fs.writeFileSync('translations.js', c, 'utf8');
  console.log('Fixed AR block');
} else {
  console.log('Pattern not matched - checking around line 320:');
  c.split('\n').slice(318, 323).forEach((l, i) => console.log(318+i+':', JSON.stringify(l.substring(0,100))));
}
