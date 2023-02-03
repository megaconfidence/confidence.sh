---
title: "How To Fix Docker Container DNS / Internet Issues"
date: 2023-02-03
description: "A simple fix for internet connection issues in Docker containers"
summary: "A simple fix for internet connection issues in Docker containers"
tags: ["self-hosting", "docker"]
---
Your Docker containers don't seem to have internet connection or can't resolve DNS queries?

TLDR; This issue is most likely due to the fact that your containers can’t resolve DNS queries using your host’s DNS servers (which may be unreachable from the containers). You can fix this in two ways:

- Globally for all Docker containers
- Locally for an individual container

## Fixing DNS Or Internet Issues Globally For All Docker Containers

Edit the Docker daemon configuration file at `/etc/docker/daemon.json` or create it if it doesn’t exist. Then, add new custom DNS servers:

```json
{
    "dns": ["8.8.8.8", "1.1.1.1"]
}
```

In this example, Google’s  `8.8.8.8` and Cloudflare’s `1.1.1.1` DNS servers will be used in place of the host’s DNS servers for *all* containers.

Save the file and restart the Docker daemon with:

```sh
sudo service docker restart
```

## Fixing DNS Or Internet Issues Locally For An Affected Container

If you’d only want to change the DNS server for a single container, you can directly add the new addresses to the container as shown below:

```json
yourcontainer:
    image: you/yourimage
		# regular container config...
    dns:
      - "8.8.8.8"
      - "1.1.1.1"
```

## Conclusion

This was a really straightforward fix and I hope this helps. If you’d love to learn more, check out this article by Robin [https://robinwinslow.uk/fix-docker-networking-dns](https://robinwinslow.uk/fix-docker-networking-dns)

Till we meet again, bye!
