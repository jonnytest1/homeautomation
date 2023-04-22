#include "jsonnode.h"
#include "str.h"
#include <list>

enum ParseModes
{
    EXPECTING_JSON,
    EXPECTING_STRING_END,
    EXPECTING_NUMBER_END,
    EXPECTING_ARRAY_END,
    EXPECTING_OBJECT_KEY_START,
    EXPECTING_OBJECT_KEY_END,
    EXPECTING_OBJECT_KEY_COLON,
    DONE
};
JsonNode::JsonNode()
{
}

JsonNode parseJson(String body)
{
    std::list<ParseModes> parseModes = {EXPECTING_JSON, DONE};
    parseModes.front();
    JsonNode initial;
    std::list<JsonNode *> nodes = {&initial};
    int size = body.length();
    for (int i = 0; i < size; i++)
    {
        char character = body[i];
        ParseModes mode = parseModes.front();
        JsonNode *current = nodes.front();

        if (mode == EXPECTING_JSON)
        {
            if (character == '"')
            {
                current->isText = true;
                parseModes.pop_front();
                parseModes.push_front(EXPECTING_STRING_END);
            }
            else if (isNumeric(String(character)))
            {
                current->isNumber = true;
                current->valueCollector += character;
                parseModes.pop_front();
                parseModes.push_front(EXPECTING_NUMBER_END);
            }
            else if (character == 't' && body[i + 1] == 'r' && body[i + 2] == 'u' && body[i + 3] == 'e')
            {
                current->isBool = true;
                current->boolValue = true;
                parseModes.pop_front();
                i += 3;
            }
            else if (character == 'f' && body[i + 1] == 'a' && body[i + 2] == 'l' && body[i + 3] == 's' && body[i + 4] == 'e')
            {
                current->isBool = true;
                current->boolValue = false;
                parseModes.pop_front();
                i += 4;
            }
            else if (character == '[')
            {

                JsonNode itemNode;
                current->isArray = true;
                nodes.push_front(&itemNode);
                parseModes.pop_front();
                parseModes.push_front(EXPECTING_ARRAY_END);
                parseModes.push_front(EXPECTING_JSON);
            }
            else if (character == '{')
            {

                current->isObject = true;
                parseModes.pop_front();
                parseModes.push_front(EXPECTING_OBJECT_KEY_START);
            }
            else
            {
                printf("new json type ?");
            }
        }
        else if (mode == EXPECTING_NUMBER_END)
        {
            if (!isNumeric(String(character)))
            {
                current->numberValue = stoi(current->valueCollector.c_str());
                parseModes.pop_front();
                mode = parseModes.front();

                printf("TODO");
            }
            else
            {
                current->valueCollector += character;
            }
        }

        if (mode == EXPECTING_STRING_END)
        {
            if (character == '"')
            {
                current->textValue = current->valueCollector.c_str();
                parseModes.pop_front();
            }
            else
            {
                current->valueCollector += character;
            }
        }
        else if (mode == EXPECTING_ARRAY_END)
        {
            if (character == ',')
            {
                JsonNode prevItem = *nodes.front();
                if (!prevItem.wasSet())
                {
                    throw std::runtime_error("item wasnt set but found ,");
                }
                nodes.pop_front();
                JsonNode *arrayParent = nodes.front();

                arrayParent->arrayContent.push_back(prevItem);
                arrayParent->arrayLength += 1;

                JsonNode newNode = JsonNode();

                nodes.push_front(&newNode);
                parseModes.push_front(EXPECTING_JSON);
            }
            else if (character == ']')
            {
                JsonNode prevItem = *nodes.front();
                if (prevItem.wasSet())
                {
                    nodes.pop_front();
                    JsonNode *arrayParent = nodes.front();

                    arrayParent->arrayContent.push_back(prevItem);
                    arrayParent->arrayLength += 1;
                }

                nodes.pop_front();
                parseModes.pop_front();
            }
        }
        else if (mode == EXPECTING_OBJECT_KEY_START)
        {
            if (character == '"')
            {

                parseModes.pop_front();
                parseModes.push_front(EXPECTING_OBJECT_KEY_END);
            }
            // ignore whitespace
        }
        else if (mode == EXPECTING_OBJECT_KEY_END)
        {
            if (character == '"')
            {

                JsonNode keyData;
                keyData.keyValue = current->valueCollector.c_str();

                nodes.push_front(&keyData);
                parseModes.push_front(EXPECTING_OBJECT_KEY_COLON);
            }
            else if (character == ',')
            {
                JsonNode *item = nodes.front();
                nodes.pop_front();
                JsonNode *objectParent = nodes.front();
                if (!item->wasSet())
                {
                    throw std::runtime_error("object item wasnt set but found ,");
                }
                JsonNode itemVal = *item;
                String key = itemVal.keyValue.c_str();
                std::pair<String, JsonNode> pair(key, itemVal);
                objectParent->objectContent.insert(pair);
                objectParent->valueCollector = "";
                parseModes.pop_front();
                parseModes.push_front(EXPECTING_OBJECT_KEY_START);
            }
            else if (character == '}')
            {
                JsonNode *item = nodes.front();
                nodes.pop_front();
                JsonNode *objectParent = nodes.front();
                if (item->wasSet())
                {
                    JsonNode currentItem = *item;

                    std::pair<String, JsonNode>
                        pair(currentItem.keyValue.c_str(), currentItem);
                    objectParent->objectContent.insert(pair);
                }

                parseModes.pop_front();
            }
            else
            {
                current->valueCollector += character;
            }
        }
        else if (mode == EXPECTING_OBJECT_KEY_COLON)
        {
            if (character == ':')
            {
                parseModes.pop_front();
                parseModes.push_front(EXPECTING_JSON);
            }
        }

        if (i == size - 1)
        {

            ParseModes finalMode = parseModes.front();
            if (finalMode == EXPECTING_NUMBER_END)
            {
                current->numberValue = stoi(current->valueCollector.c_str());
                parseModes.pop_front();
            }
            else if (finalMode == DONE)
            {
                // nothing to do
            }
            else
            {
                printf("last");
            }
        }
    }
    ParseModes finalMode = parseModes.front();
    if (finalMode != DONE)
    {
        // printf("not done");
    }
    return initial;
}

std::string *JsonNode::objectKeys()
{

    std::string *keyAr = new std::string[objectContent.size()];
    int ct = 0;
    for (std::map<String, JsonNode>::iterator it = objectContent.begin(); it != objectContent.end(); ++it)
    {
        String key = it->first;
        const char *keyVal = key.c_str();
        keyAr[ct++] = keyVal;
    }

    return keyAr;
}
