import requests
import json

def test():
    with open('samples/sample_academic_assignment.pdf', 'rb') as f:
        r = requests.post('http://127.0.0.1:8000/api/upload', files={'file': ('sample_academic_assignment.pdf', f, 'application/pdf')})

    print('Upload status:', r.status_code)
    data = r.json()
    doc_id = data['doc_id']
    print('Doc ID:', doc_id)

    r_stream = requests.get(f'http://127.0.0.1:8000/api/pipeline/stream/{doc_id}', stream=True)
    final_result = None
    for line in r_stream.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                evt = json.loads(line_str[6:])
                print(f"[{evt.get('agent', 'System')}] {evt.get('message')}")
                if evt.get('event') == 'pipeline_finished':
                    final_result = evt.get('result')

    if final_result:
        print('\n================ VERIFICATION ================')
        print('Doc Type:', final_result.get('doc_type'))
        print('PII Entities:', [(e['text'], e['entity_type']) for e in final_result.get('pii_entities')])
        print('Risk Findings:', [(rf['clause_id'], rf['clause_title'], rf['severity']) for rf in final_result.get('risk_findings')])
        print('Schema Type:', final_result.get('extracted_schema', {}).get('schema_type'))
        print('Student Record:', final_result.get('extracted_schema', {}).get('student_record'))
        print('Faculty Evaluator:', final_result.get('extracted_schema', {}).get('faculty_evaluator'))
        print('Proof Zero Leakage:', final_result.get('text_erased_proof', {}).get('verified_zero_leakage'))

if __name__ == '__main__':
    test()
