import urllib.request
import json
import sys

param =[]
for item in sys.argv[1:]:
    param.append({'x' : item.split(',')[0], 'y': item.split(',')[1], 'text' : item.split(',')[2], 'isFixed' : 'false'})

data = {
        "Inputs": {
                "input": param
        },
    "GlobalParameters":  {
    }
}

body = str.encode(json.dumps(data))

url = 'https://ussouthcentral.services.azureml.net/workspaces/40d09a0901e34fd1a176fb9af1e349a5/services/edcabd4c82cb400ca513c18455914623/execute?api-version=2.0&format=swagger'
api_key = 'rQYcXzD8Q3E1PTohBeWqKN/eVw/aj7fKrflWjMVGMH6UEB1ZCEEVSYgNylf9Go6+HOUVrGOCdovDH+wvgvI3JA=='
headers = {'Content-Type':'application/json', 'Authorization':('Bearer '+ api_key)}

req = urllib.request.Request(url, body, headers)

try:
    response = urllib.request.urlopen(req)

    result = response.read()
    print(json.dumps(result.decode("utf8", 'ignore')))
except urllib.error.HTTPError as error:
    # print("The request failed with status code: " + str(error.code))

    # print(error.info())
    print(json.loads(error.read().decode("utf8", 'ignore')))