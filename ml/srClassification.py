import urllib.request
import json
import sys

param = []
for item in sys.argv[1:]:
    param.append({'x': item.split('::')[0], 'y': item.split('::')[1], 'text': item.split('::')[2], 'columnNo': '0'});

data = {
        "Inputs": {
                "input1": param
        },
    "GlobalParameters":  {
    }
}

body = str.encode(json.dumps(data))

url = 'https://ussouthcentral.services.azureml.net/workspaces/40d09a0901e34fd1a176fb9af1e349a5/services/1a0a2782731f4ea0bf1e1813e7ab94b7/execute?api-version=2.0&format=swagger'
api_key = 'PXFytbP7OFoML6UDOP/RVM2e+F2DUVPVOcV6MB+nXFXbKEkdiTB42j15U3aMD8JXy2KHsV3HiImO+eIPPnAL/Q=='
headers = {'Content-Type':'application/json', 'Authorization':('Bearer '+ api_key)}

req = urllib.request.Request(url, body, headers)

try:
    response = urllib.request.urlopen(req)

    result = response.read()
    print(json.dumps(result.decode("utf8", 'ignore')))
except urllib.error.HTTPError as error:

    print(json.loads(error.read().decode("utf8", 'ignore')))
