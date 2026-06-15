# Black Sea Company Scenario Builder

## ⚠️ License and Copyright

This project is the intellectual property of the author. The source code is open strictly for evaluation, learning, and non-commercial use.

* Commercial use (including corporate use, paid products, and advertising) is strictly PROHIBITED.
* Attribution is REQUIRED: Any copy or modification of this code must include the original author's name and a link back to this repository.

For commercial licensing inquiries or permissions, please contact the author via: doroshkevichgraf@gmail.com

An advanced, offline-first narrative development workstation and node-based scenario builder. Tailored for organizing story cells, layout graphs, dialog sequences, and logic nodes within a high-performance visual diagram.

---

## Technical Overview

The workspace provides real-time state manipulation, connection mapping, hierarchical block alignment algorithms, and custom project export capabilities. All projects remain serialized inside local configurations, securing project integrity when deploying or migrating environment builds.

### Key Capabilities

- **Interactive Node Canvas**: Manage nodes ("Story Cells") on a fully panning, zoomable grid. Establish visual routing connections dynamically.
- **Hierarchical Auto-Alignment**: Instantly align elements from left-to-right using custom layout tree topology algorithms. It analyzes incoming/outgoing relations and places them with balanced vertical spacing.
- **Precision Snapping Grid**: Toggle alignment mechanics targeting customizable 20px grid arrays to maintain pristine aesthetic uniformity.
- **Sticky Navigator & Deep Search**: Deep-scan files, containers, names, tag markers, and text parameters. Filters unsuited items reactively from the sliding navigator drawer as you type.
- **Copy/Paste Portability**: Instantly copy-paste serialized JSON definitions or custom schema exports to import/export graphs fluidly across discrete projects.

---

## Layout Controls

- **Pan**: Drag on empty grid canvas space.
- **Zoom**: Wheel or trace gestures to focus structural zones.
- **Add Cell**: Double-click standard container segments.
- **Link**: Connect terminals via drag handles.
- **Group**: Draw selection parameters using structural bounding boxes.
