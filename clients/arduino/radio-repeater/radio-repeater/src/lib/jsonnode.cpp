#include "jsonnode.h"
#include "str.h"

JsonNode::JsonNode(String body)
{
    body.trim();
    nodeStr = body;

    if (body.startsWith("\"") && body.endsWith("\""))
    {
        isText = true;
        textValue = body.substring(1, body.length() - 1);
    }
    else if (body == "true")
    {
        isBool = true;
        boolValue = true;
    }
    else if (body == "false")
    {
        isBool = true;
        boolValue = false;
    }
    else if (body == "null")
    {
        isNull = true;
    }
    else if (isNumeric(body))
    {
        isNumber = true;
        numberValue = stoi(body);
    }
    else if (body.startsWith("{") && body.endsWith("}"))
    {
        isObject = true;
        parseObject();
    }
    else if (body.startsWith("[") && body.endsWith("]"))
    {
        isArray = true;
    }
}

void JsonNode::parseObject()
{
    int nestCt = 0;

    String objectStr = nodeStr.substring(1, nodeStr.length() - 1);
    objectStr.trim();

    String entry = "";
    for (int i = 0; i < objectStr.length(); i++)
    {

        char character = objectStr[i];

        if (character == '{')
        {
            nestCt++;
        }
        else if (character == '}')
        {
            nestCt--;
        }

        if (nestCt == 0 && character == ',')
        {
            entry.trim();
            parseObjectEntry(entry);
            entry = "";
            continue;
        }

        entry += character;
    }
    entry.trim();
    if (entry.length() > 0)
    {
        parseObjectEntry(entry);
    }
}

void JsonNode::parseObjectEntry(String entry)
{
    bool finishedKey = false;
    String val = "";
    String key = "";
    for (int i = 0; i < entry.length(); i++)
    {

        char character = entry[i];

        if (character == ':' && !finishedKey)
        {
            finishedKey = true;
            continue;
        }
        if (finishedKey)
        {
            val += character;
        }
        else
        {
            key += character;
        }
    }
    key.trim();
    key = key.substring(1, key.length() - 1);
    dbgStr += "\ninsert: " + key + "\n";
    objectContent.insert(std::pair<String, JsonNode>(key, JsonNode(val)));
}