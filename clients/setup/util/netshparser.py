

from typing import Union


def parse_to_json(stdout: str):
    stdout = stdout.replace("\r", "")

    obj = dict()
    root_obj = obj
    lines = stdout.split("\n")
    prev_keys: list[str] = []
    last_lstripct = 0
    for line in lines:
        if len(line.strip()) == 0:
            continue
        if not ":" in line:
            continue
        key, value = line.split(":", 1)

        stripped_key = key.strip()
        stripped_val = value.strip()

        if key.startswith(" "):
            space_len = len(key)-len(key.lstrip())
            if space_len == last_lstripct:
                prev_keys.pop()

            if space_len < last_lstripct:
                prev_keys.pop()
                prev_keys.pop()

            temp_obj: dict = obj
            parent: Union[dict, None] = None
            for i in range(len(prev_keys)):
                sub_key = prev_keys[i]
                if isinstance(temp_obj[sub_key], str):
                    temp_obj[sub_key] = dict(name=temp_obj[sub_key])
                parent = temp_obj
                temp_obj = temp_obj[sub_key]

                if isinstance(temp_obj, list):
                    temp_obj = temp_obj[-1]

            if stripped_key in temp_obj and parent is not None:

                last_key = prev_keys[-1]
                parent[last_key] = [temp_obj]
                temp_obj = dict()
                parent[last_key].append(temp_obj)

                # print("subky xists")

            temp_obj[stripped_key] = stripped_val
            prev_keys.append(stripped_key)

            last_lstripct = space_len
        else:
            if stripped_key in obj:
                root_obj = [obj]
                obj = dict()
                root_obj.append(obj)
            prev_keys = [stripped_key]
            obj[stripped_key] = stripped_val
            last_lstripct = 0

    return root_obj
