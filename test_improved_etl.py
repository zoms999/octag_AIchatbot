#!/usr/bin/env python3
"""
개선된 ETL 작업 테스트
"""

import asyncio
import sys
import requests
import json
sys.path.append('.')

async def test_improved_etl():
    print("=== 개선된 ETL 작업 테스트 ===")
    
    # 테스트 완료 알림 전송
    url = "http://127.0.0.1:8000/api/etl/test-completion"
    
    headers = {
        "accept": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTI5NDgwMmMtMjIxOS00NjUxLWE0YTUtYTlhNWRhZTc1NDZmIiwidXNlcl90eXBlIjoicGVyc29uYWwiLCJhY19pZCI6InRlc3Q5OTkiLCJleHAiOjE3NTUyNTA2MzIsImlhdCI6MTc1NTE2NDIzMn0.PXZoN6oiJx8mXTT9UoDTfzXh5XDcY7tmJYIiA-Hb16A",
        "Content-Type": "application/json"
    }
    
    data = {
        "user_id": "5294802c-2219-4651-a4a5-a9a5dae7546f",
        "anp_seq": 18240
    }
    
    try:
        print("ETL 작업 시작 요청 전송 중...")
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        print(f"응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            job_id = result.get('job_id')
            print(f"✅ ETL 작업 시작됨: Job ID = {job_id}")
            
            # 작업 진행 상황 모니터링
            print("\n작업 진행 상황 모니터링 중...")
            for i in range(30):  # 최대 5분 대기
                await asyncio.sleep(10)  # 10초마다 확인
                
                # 작업 상태 확인
                from check_etl_status import check_etl_status
                print(f"\n--- {i*10}초 경과 ---")
                await check_etl_status()
                
                # 완료 여부 확인 (간단한 방법)
                status_response = requests.get(
                    f"http://127.0.0.1:8000/api/etl/status/{job_id}",
                    headers={"Authorization": headers["Authorization"]},
                    timeout=5
                )
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    if status_data.get('status') in ['completed', 'failed']:
                        print(f"✅ 작업 완료: {status_data.get('status')}")
                        break
                else:
                    print("상태 확인 실패, 계속 모니터링...")
                    
        else:
            print(f"❌ ETL 작업 시작 실패: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다.")
    except Exception as e:
        print(f"❌ 에러 발생: {e}")

if __name__ == "__main__":
    asyncio.run(test_improved_etl())