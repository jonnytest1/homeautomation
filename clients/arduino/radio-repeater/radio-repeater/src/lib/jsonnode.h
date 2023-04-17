
#include "arduino-ref.h"
#include <map>

class JsonNode
{
public:
    JsonNode(String content);

    String asText();
    bool isText = false;
    bool isNumber = false;
    bool isObject = false;
    bool isArray = false;
    bool isBool = false;
    bool isNull = false;

    std::map<String, JsonNode> objectContent;
    String dbgStr;

private:
    String nodeStr;

    String textValue;
    bool boolValue;
    int numberValue;
    void parseObject();
    void parseObjectEntry(String entry);
};
