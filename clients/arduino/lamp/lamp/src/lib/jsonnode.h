#include "arduinoref.h"
#include <map>
#include <vector>

class JsonNode
{
public:
    JsonNode();

    String textValue;
    bool isText = false;
    bool isNumber = false;
    bool isObject = false;
    bool isArray = false;
    bool isBool = false;
    bool isNull = false;

    bool wasSet()
    {
        return isText || isNull || isNumber || isObject || isBool || isArray;
    }

    std::map<String, JsonNode> objectContent;
    std::string *objectKeys();
    std::vector<JsonNode> arrayContent;
    unsigned int arrayLength = 0;
    String dbgStr;
    int numberValue = 0;
    bool boolValue;
    std::string valueCollector;
    std::string keyValue;

private:
    String nodeStr;
};

JsonNode parseJson(String content);