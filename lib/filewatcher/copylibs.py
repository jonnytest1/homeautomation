import json
import os
import shutil
workspaceJsonPath = "D:\\Jonathan\\visualstudio-workspaces\\smarthome.code-workspace"

workspaceJsonDirectory = os.path.dirname(workspaceJsonPath)
projectroot = os.path.realpath(os.path.join(
    os.path.dirname(__file__), "../python"))


def copy_all(watchdir):
    with open(workspaceJsonPath, 'r') as workspaceFile:
        workspaceJsonStr = workspaceFile.read()
        workspaceJson = json.loads(workspaceJsonStr)

        for folder in workspaceJson["folders"]:
            workspaceFolderPath = os.path.abspath(
                os.path.join(workspaceJsonDirectory, folder["path"]))
            library_path = os.path.join(
                workspaceFolderPath, "smarthome")

            if os.path.exists(library_path):
                copy_to_workspace(library_path,
                                  projectroot)
            library_src_path = os.path.join(
                workspaceFolderPath, "src", "smarthome")
            if os.path.exists(path=library_src_path):
                copy_to_workspace(library_src_path,
                                  projectroot)


def copy_to_workspace(targetDir, libDirectory):
    try:
        os.mkdir(targetDir)
    except:
        pass

    shutil.copytree(libDirectory, targetDir, dirs_exist_ok=True)
    # for file in os.listdir(libDirectory):
    #    fileCurrent = os.path.join(libDirectory, file)
    #   shutil.copytree(fileCurrent, os.path.join(
    #       targetDir, file))

    print("added for "+os.path.basename(targetDir))
