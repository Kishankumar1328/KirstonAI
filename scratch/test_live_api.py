import urllib.request
import json

url = 'http://localhost:8000/api/v1/chat/stream'
payload = {
    'thread_id': 'test_thread_tts_999',
    'message': 'convert to speech: Welcome to Kirston AI powered by NVIDIA Nemotron Text to Speech synthesis.',
    'model': 'nvidia/nemotron-speech-v1'
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})

try:
    res = urllib.request.urlopen(req)
    print("HTTP STATUS:", res.getcode())
    out = res.read().decode('utf-8')
    print("\n--- STREAM OUTPUT RECEIVED FROM BACKEND SERVER ---")
    print(out)
except Exception as e:
    print("ERROR:", e)
