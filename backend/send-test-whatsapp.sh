#!/bin/bash

# WhatsApp test message script
TOKEN="EAAiYOriHXGEBPKPVvEDi87QEesu5NLVPo7m7LT5vdpPEsfcgteksuFKOOA52OmNCR4BhSk4xjaCz9W131xZAgZAJlQBFdPjA26kezYH2t8dtVAeDqLQ8tH8pQVDUtXrwWIjyiuBH2t15VNOahriyVNMX2kNzf608g7Tz8d5lEvUcAiKvH90OFQ3ZBZCpOwr72CWm9zdOZCfd0aAP6G678vnbvnVyv0BbfH2o6T65nzVUOYo"
PHONE_ID="604435462747094"
TO_NUMBER="919955100649"

echo "📱 Sending WhatsApp message..."
echo "To: $TO_NUMBER"

curl -X POST "https://graph.facebook.com/v18.0/$PHONE_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"$TO_NUMBER\",
    \"type\": \"text\",
    \"text\": {
      \"body\": \"Test message from FanToPark CRM!\"
    }
  }"

echo ""
echo "Done!"