# conway-life
Conway's Game of Life implemented in .NET 7, TypeScript and WebGL

### Periodic Oscillations
Colours are used to highlight periodic oscillations<br>
Red = period of 2<br>
Blue = period of 3<br>
Green = period of 5<br>
Purple = period of 6<br>

### Controls
Left click: Toggle cell on/off<br>
Space: Toggle pause<br>
R: Reset (all cells set to off state)<br>

### Docker
docker build -t conwaylife .
docker run -it --rm -p 8080:80 conwaylife
Then visit http://127.0.0.1:8080/ in the browser

### Vscode dev in Docker
docker run -it -p 8080:80 conwaylife
(note no --rm this time)
Exit terminal and run from Docker for Windows

Make sure the Dev Containers extension is installed
Click the green box in the bottom left

Connect to the container using the top menu
In the explorer tab, click "Open Folder" and open /app/
If desired, click to open a .cs file and install the C# extension if prompted
Click to open wwwroot/ts/main.ts

In the terminal, run dotnet dev-certs https
If "trusting" the cert is ever required, go to:
https://learn.microsoft.com/en-gb/aspnet/core/security/enforcing-ssl?view=aspnetcore-7.0&tabs=visual-studio%2Clinux-ubuntu#ssl-linux

Make your code changes
Press F5
Browser tab should auto open but if not try localhost:<port> where port is listed in the ports tab.
