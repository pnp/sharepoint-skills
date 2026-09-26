# Project Aurora — Solution Overview

**Last updated:** 3 September 2026

## Scope

The solution uses SharePoint Online for case workspaces and document collaboration. A custom integration service connects the workspace with the existing customer master-data service and the document-conversion service.

## Current architecture status

Core solution design is approved. The final production hosting topology for the integration service is not yet approved and is tracked as Decision D-014.

## Open dependency

Deployment automation and final network configuration depend on D-014. Development and functional testing can continue while the decision is open, but production deployment planning cannot be finalized.
