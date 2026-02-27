# Todo List – Okteto VolumeSnapshots Test

A simple Node.js + MongoDB todo list application used to test [Okteto's VolumeSnapshots](https://www.okteto.com/docs/core/use-volume-snapshots/#using-volume-snapshots-in-your-development-environment) feature. The goal is to demonstrate how data written to a persistent volume in one namespace can be captured as a snapshot and consumed by an application in a separate namespace.

## How it works

The repository contains two separate deployment configurations:

- **Source application** (`source-okteto.yml` / `source-docker-compose.yml`): deployed in the `source-vol-snap` namespace. This is where you write data to the MongoDB database.
- **Consumer application** (`consumer-okteto.yml` / `consumer-docker-compose.yml`): deployed in the `consumer-vol-snap` namespace. This application restores data from a VolumeSnapshot taken from the source namespace.
- **`volume-snapshot.yaml`**: the Kubernetes manifest used to create the VolumeSnapshot from the source MongoDB persistent volume.

## Prerequisites

- Access to an [Okteto](https://www.okteto.com/) cluster
- The [Okteto CLI](https://www.okteto.com/docs/get-started/install-okteto-cli/) installed and configured
- `kubectl` configured to point to your Okteto cluster

## Step-by-step guide

### 1. Create the namespaces

Create two namespaces in your Okteto cluster — one for the source application and one for the consumer.

```bash
okteto ns create source-vol-snap
okteto ns create consumer-vol-snap
```

> **Note:** If you use different namespace names, make sure to update the namespace referenced in the volume annotation inside `consumer-docker-compose.yml` accordingly.

### 2. Deploy the source application

Switch to the source namespace and deploy the application.

```bash
okteto ns use source-vol-snap
okteto deploy -f source-okteto.yml
```

### 3. Add data to the todo list

Once deployed, open the application through the endpoint shown in the Okteto UI and add a few tasks to the todo list. For example:

- `task1`
- `task2` (mark as completed)
- `task3`

### 4. (Optional) Verify data in MongoDB

You can confirm the data was persisted in the database by connecting directly to the MongoDB pod:

```bash
kubectl exec -it <mongo-pod-name> -n source-vol-snap -- bash
```

Inside the pod, start a MongoDB shell and inspect the data:

```
mongosh
use todoapp
show collections   # should show: todos
db.todos.find()    # should return the tasks you added
```

### 5. Create the VolumeSnapshot

Apply the VolumeSnapshot manifest and wait for it to become ready for use.

```bash
kubectl apply -f volume-snapshot.yaml -n source-vol-snap
```

You can check the snapshot status with:

```bash
kubectl get volumesnapshot mongo-snapshot -n source-vol-snap
```

Wait until the `READYTOUSE` column shows `true`.

### 6. Deploy the consumer application

Switch to the consumer namespace and deploy the application that will restore data from the snapshot.

```bash
okteto ns use consumer-vol-snap
okteto deploy -f consumer-okteto.yml
```

### 7. Verify the snapshot data

Once the consumer application is running, open it through its endpoint in the Okteto UI. The todo list should display the same tasks (`task1`, `task2`, `task3`) that were created in the source namespace — confirming that the VolumeSnapshot was successfully restored.

## Repository structure

```
.
├── public/                      # Frontend assets
├── Dockerfile                   # Application Docker image
├── server.js                    # Node.js backend
├── package.json
├── source-docker-compose.yml    # Compose config for source app
├── source-okteto.yml            # Okteto manifest for source app
├── consumer-docker-compose.yml  # Compose config for consumer app
├── consumer-okteto.yml          # Okteto manifest for consumer app
└── volume-snapshot.yaml         # Kubernetes VolumeSnapshot manifest
```

## References

- [Okteto VolumeSnapshots documentation](https://www.okteto.com/docs/core/use-volume-snapshots/#using-volume-snapshots-in-your-development-environment)
- [Okteto CLI reference](https://www.okteto.com/docs/reference/okteto-cli/)