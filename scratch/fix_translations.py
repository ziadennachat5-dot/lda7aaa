import re, sys

with open('translations.js', encoding='utf-8') as f:
    content = f.read()

# Find the broken single-line with escaped sequences
marker = r'\n        { num: \"01\"'
if marker in content:
    # Regex: match the full broken line from 'steps' to the end of the ar block
    content = re.sub(
        r'      steps: \[\\n.*?\\n    \}\\n  \},',
        '''      steps: [
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
  },''',
        content, flags=re.DOTALL
    )
    with open('translations.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed and written')
else:
    # Show context around line 320
    lines = content.splitlines()
    for i, line in enumerate(lines[315:325], start=316):
        print(f'{i}: {repr(line[:120])}')
    print('Marker not found - no change made')
