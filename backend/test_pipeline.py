import urllib.request
import json
import time

def test_stream(sample_name="medical_billing"):
    print(f"\n--- TESTING PIPELINE FOR: {sample_name} ---")
    load_url = f"http://127.0.0.1:8000/api/samples/{sample_name}/load"
    load_res = json.loads(urllib.request.urlopen(load_url).read().decode())
    doc_id = load_res["doc_id"]
    print(f"Loaded doc_id: {doc_id} (file: {load_res['filename']})")

    stream_url = f"http://127.0.0.1:8000/api/pipeline/stream/{doc_id}"
    req = urllib.request.urlopen(stream_url)
    
    count = 0
    final_result = None
    for line in req:
        line_str = line.decode("utf-8").strip()
        if line_str.startswith("data:"):
            count += 1
            payload = json.loads(line_str[5:].strip())
            agent = payload.get("agent", "SYSTEM")
            msg = payload.get("message", "")
            prog = payload.get("progress", 0)
            print(f"[{prog}%] [{agent}] {msg}")
            if payload.get("event") == "pipeline_finished":
                final_result = payload.get("result")
                break

    if final_result:
        print("\n=== PIPELINE SUCCESS ===")
        print(f"Doc ID: {final_result['doc_id']}")
        print(f"Doc Type: {final_result['doc_type']}")
        print(f"Tokens: {final_result['tokens_count']} ({final_result['bounding_boxes_count']} boxes)")
        print(f"PII Redacted: {len(final_result['pii_entities'])}")
        for p in final_result['pii_entities'][:4]:
            print(f"   -> [{p['entity_type']}] '{p['text']}' @ {p['bbox']}")
        print(f"Risks Caught: {len(final_result['risk_findings'])}")
        for r in final_result['risk_findings']:
            print(f"   -> [{r['severity']}] {r['clause_title']}")
        print(f"Diff Privacy Guarantee: {final_result['differential_privacy']['guarantee']}")
        print(f"Laplace Noise: {final_result['differential_privacy']['laplace_noise']} (Privatized: ${final_result['differential_privacy']['privatized_aggregate']})")
        print(f"Audit Hash SHA-256: {final_result['audit_hash']}")
        print(f"Zero Leakage Verified: {final_result['text_erased_proof']['verified_zero_leakage']}")

def test_unredact(sample_name="redacted_photo"):
    print(f"\n--- TESTING FORENSIC UN-REDACT PIPELINE FOR: {sample_name} ---")
    load_url = f"http://127.0.0.1:8000/api/samples/{sample_name}/load"
    load_res = json.loads(urllib.request.urlopen(load_url).read().decode())
    doc_id = load_res["doc_id"]
    print(f"Loaded doc_id: {doc_id} (file: {load_res['filename']})")

    stream_url = f"http://127.0.0.1:8000/api/unredact/stream/{doc_id}?demo_mode=false"
    req = urllib.request.urlopen(stream_url)

    final_result = None
    for line in req:
        line_str = line.decode("utf-8").strip()
        if line_str.startswith("data:"):
            payload = json.loads(line_str[5:].strip())
            agent = payload.get("agent", "SYSTEM")
            msg = payload.get("message", "")
            prog = payload.get("progress", 0)
            print(f"[{prog}%] [{agent}] {msg}")
            if payload.get("event") == "pipeline_finished":
                final_result = payload.get("unredact_result")
                break

    if final_result:
        print("\n=== UN-REDACT SUCCESS ===")
        print(f"Doc ID: {final_result['doc_id']}")
        print(f"Classification: {final_result['doc_type']}")
        print(f"Is Photo/Image Input: {final_result['is_image_input']}")
        print(f"Redactions Detected: {final_result['redactions_detected']}")
        print(f"Recovery Methods: {final_result['recovery_methods_used']}")
        print(f"Recovered Entities ({len(final_result['unredacted_entities'])}):")
        for ent in final_result['unredacted_entities']:
            print(f"   -> [{ent['entity_type']}] \"{ent['recovered_text']}\" ({round(ent['confidence']*100, 1)}% via {ent['method']})")
        print("\nExtracted Document Intelligence:")
        for k, v in final_result['extracted_info'].items():
            print(f"   {k}: {v}")

if __name__ == "__main__":
    test_stream("medical_billing")
    test_unredact("redacted_photo")
    test_unredact("fake_redacted_medical")
