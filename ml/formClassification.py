import sys
import urllib.request
import json

param = []
param.append({
    'A': sys.argv[1],   
    'B': sys.argv[2],   
    'C': sys.argv[3],   
    'D': sys.argv[4],   
    'E': sys.argv[5],   
    'F': sys.argv[6],   
    'G': sys.argv[7],   
    'H': sys.argv[8],   
    'I': sys.argv[9],   
    'J': sys.argv[10],   
    'K': sys.argv[11],   
    'L': sys.argv[12],
    'M': sys.argv[13],
    'N': sys.argv[14],
    'O': sys.argv[15],
    'P': sys.argv[16],
    'Q': sys.argv[17],
    'R': sys.argv[18],
    'S': sys.argv[19],
    'T': sys.argv[20],
    'U': sys.argv[21],
    'V': sys.argv[22],  
    'W': sys.argv[23],
    'X': sys.argv[24], 
    'Y': sys.argv[25],  
    'Z': sys.argv[26],
    'ETC': sys.argv[27],
    'FORM': '0'
    });

data = {
        "Inputs": {
                "input1": param
        },
    "GlobalParameters":  {
    }
}

body = str.encode(json.dumps(data))

url = 'https://ussouthcentral.services.azureml.net/workspaces/40d09a0901e34fd1a176fb9af1e349a5/services/188cb99092844c399fff587709fe2036/execute?api-version=2.0&format=swagger'
api_key = 'hp0HMm57IMgnyu3Tvz2uqrPfMt1wOnDb9c+b35qlfC8QKyveDzRkq6oQdXtRdCcLUg3M+UqROWBSEgIGEepezw=='
headers = {'Content-Type':'application/json', 'Authorization':('Bearer '+ api_key)}

req = urllib.request.Request(url, body, headers)

try:
    response = urllib.request.urlopen(req)

    result = response.read()
    print(json.dumps(result.decode("utf8", 'ignore')))

except urllib.error.HTTPError as error:
    print(json.loads(error.read().decode("utf8", 'ignore')))
