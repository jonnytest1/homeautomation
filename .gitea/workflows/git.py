
import subprocess


def increase_fetch_ct():
    print("increasing fetch ct to 100")
    print( subprocess.run(args="pwd", shell=True).stdout)
    process = subprocess.run("git fetch --depth=100", shell=True, stdout=subprocess.PIPE)

    return process.stdout.decode().strip().split('\n')


def get_changed_files(to_parent: str,increased_fetch=False):
    print("get_changed_files")
    print(subprocess.run(args="pwd", shell=True).stdout)
    process = subprocess.run(
        f"git diff --name-only HEAD {to_parent}", shell=True, stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    output=process.stdout.decode().strip()
    err=process.stderr.decode().strip()
    print(err)
    
    if "fatal: bad object" in err:
        print("got bad object")
        if increased_fetch:
          raise Exception("already increased fetch")
        increase_fetch_ct()
        return get_changed_files(to_parent,True)
    
      
    return output.split('\n')


def current_commit():
    print("current_commit")
    process = subprocess.run(
        "git rev-parse HEAD", shell=True, stdout=subprocess.PIPE)

    return process.stdout.decode().strip()
