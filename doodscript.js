const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const canvasContainer = document.getElementById("canvasContainer");
const viewportMeta = document.querySelector('meta[name="viewport"]');
const zoomElement = document.getElementById("myCanvas");

let zoom = 1;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let offsetX = 0;
let offsetY = 0;

let allCoords = [];
addCoords(center()[0], center()[1], "Barbara");

let parents = new Map();
let centerObj = {name: "Barbara", x: center()[0], y: center()[1], children: []};

let resizeOffset = {x: 0, y: 0};

const radius = 15;

const infoPanel = document.getElementById('infoPanel');
const infoPanelTitle = document.getElementById('infoPanelTitle');
const infoPanelText = document.getElementById('infoPanelText');

let nodeRelations = new Map(); 

parents.set("Barbara", ["Dave", "Jim", "Kim", "Jackie", "Matt", "Andy", "Tina", "Jimmy", "Missy"])
parents.set("Dave", ["Ella", "Ben", "Jennifer"])
parents.set("Matt", ["Frankie"])
parents.set("Missy", ["Russ", "Ryan"])
parents.set("Jimmy", ["Cathleen"])
parents.set("Jim", ["Terry", "Nora"])
// parents.set("Andy"])
parents.set("Jackie", ['Brian'])
parents.set("Jennifer", ["Buzz"])
// parents.set("Brian", ["Andrew", "Issac"]);
parents.set("Tina", ["Megan", "Gillian", "Casey"])
parents.set("Ella", ["Aleks"])

let colorMap = new Map();

for (const parent of parents) {
    colorMap.set(parent[0], getRandomColor());
    index = 0
    for (const child of parent) {
        colorMap.set(parent[index], getRandomColor());
        index++;
    }
};

// Map to store persistent distance offsets
let nodeDistances = new Map();

// Map to store angle offsets
let nodeAngles = new Map();

// convert degrees to radians
function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

// Update the manual angles Map to use more intuitive degree values
let manualNodeAngles = new Map([

    ['Dave', degreesToRadians(90)],      
    ['Jackie', degreesToRadians(45)],     
    ["Matt", degreesToRadians(180)],     
    ["Missy", degreesToRadians(22.5)], 
    ["Jim", degreesToRadians(115)],
    ["Andy", degreesToRadians(400)],
    ["Jackie", degreesToRadians(310)],
    ["Pastor John", degreesToRadians(250)],
    ["Jim", degreesToRadians(275)],
    ["Terry", degreesToRadians(230)],
       // Points slightly more down-right
]);

function calculateChildPosition(parentX, parentY, index, totalChildren, distance, isParent, nodeName) {
    if (isParent) {
        distance = distance * 1.5;
        
        // For parent nodes, calculate evenly spaced angles
        const angleStep = (2 * Math.PI) / totalChildren;
        const angle = angleStep * index;
        
        return {
            x: parentX + distance * Math.cos(angle),
            y: parentY + distance * Math.sin(angle),
            angle: angle
        };
    } else {
        distance = distance;
        
        // Get or create the stored angle offset
        let angleOffset = nodeAngles.get(index) || (Math.random() * 0.1) - 0.1;
        
        // Base angle calculation for non-parent nodes
        const baseAngle = (2 * Math.PI * index) / totalChildren;
        const finalAngle = baseAngle + angleOffset;
        
        return {
            x: parentX + distance * Math.cos(finalAngle),
            y: parentY + distance * Math.sin(finalAngle),
            angle: finalAngle
        };
    }
}

function resizeCanvas(first=false) {
    // Get the actual display size
  

    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    
    // Set the canvas internal dimensions and style
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    if (first) {
        drawAll(first);
    }
    else {
        drawAll();
    }
    
}

function center() {
    return [canvas.width / 2, canvas.height / 2];
}

let centerX = center()[0];
let centerY = center()[1];

// Add this new function to calculate absolute position from relative
function getAbsolutePosition(relativeX, relativeY, parentName) {
    if (!parentName) {
        return { x: relativeX, y: relativeY };
    }
    
    const parent = allCoords.find(coord => coord.name === parentName);
    if (!parent) {
        console.warn(`Parent ${parentName} not found`);
        return { x: relativeX, y: relativeY };
    }
    
    return {
        x: parent.x + relativeX,
        y: parent.y + relativeY
    };
}

function distanceToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq != 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function drawAll(first=false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    allCoords = [];
    nodeRelations.clear();
    
    centerX = center()[0];
    centerY = center()[1];

    // Initialize random distances and angles if this is the first draw
    if (first) {
        for (const [parent, children] of parents) {
            // Set specific distances for each parent node
            const parentDistances = {
                'Dave': 140,
                'Jackie': 100,
                'Jim': 120,
                'Missy': 160,
                'Andy': 145,
                'Matt': 110,
                'Pastor John': 20,
                'Tina': 130,
                'Jackie' : 150,
                'Ella' : -5,
                'Jennifer' : -5,
                'Jimmy' : 50
            };

            children.forEach((child, index) => {
                if (!nodeDistances.has(child)) {
                    const childrenCount = children.length;
                    
                    if (parents.has(child)) {
                        // Use specific parent distance from the mapping
                        const parentBaseDistance = parentDistances[child]|| 120;
                        nodeDistances.set(child, parentBaseDistance);
                    } else {
                        // Keep randomization for child nodes
                        const baseDistance = childrenCount * 8;
                        nodeDistances.set(child, baseDistance + getRandomInt(-10, 15));
                    }
                }
                if (!nodeAngles.has(index)) {
                    nodeAngles.set(index, (Math.random() * 0.4) - 0.2);
                }
            });
        }
    }

    const positions = new Map();
    const maxAttempts = 10;

    // Store all lines for collision checking
    const lines = [];
    
    for (const [parent, children] of parents) {
        let parentPos = parent === "Barbara" ? { x: centerX, y: centerY } : 
            positions.get(parent);
            
        if (parentPos) {
            children.forEach(child => {
                const childPos = positions.get(child);
                if (childPos) {
                    lines.push({
                        x1: parentPos.x,
                        y1: parentPos.y,
                        x2: childPos.x,
                        y2: childPos.y
                    });
                }
            });
        }
    }

    for (const [parent, children] of parents) {
        let parentPos = parent === "Barbara" ? { x: centerX, y: centerY } : 
            allCoords.find(pair => pair.name === parent);

        if (parentPos) {
            children.forEach((child, index) => {
                const isParent = parents.has(child);
                let distanceOffset = nodeDistances.get(child) || 0;
                let attempts = 0;
                let validPosition = false;
                
                while (!validPosition && attempts < maxAttempts) {
                    const childCoords = calculateChildPosition(
                        parentPos.x, 
                        parentPos.y, 
                        index, 
                        children.length, 
                        75 + distanceOffset, 
                        isParent,
                        child
                    );

                    // Check for overlaps with existing positions and lines
                    let hasOverlap = false;
                    
                    // Check overlap with other nodes
                    for (const [existingName, existingPos] of positions) {
                        const distance = Math.sqrt(
                            Math.pow(childCoords.x - existingPos.x, 2) + 
                            Math.pow(childCoords.y - existingPos.y, 2)
                        );
                        if (distance < radius * 3) {
                            hasOverlap = true;
                            break;
                        }
                    }

                    // Check overlap with lines
                    if (!hasOverlap) {
                        for (const line of lines) {
                            const distance = distanceToLine(
                                childCoords.x,
                                childCoords.y,
                                line.x1,
                                line.y1,
                                line.x2,
                                line.y2
                            );
                            if (distance < radius * 1.5) { 
                                hasOverlap = true;
                                break;
                            }
                        }
                    }

                    if (!hasOverlap) {
                        validPosition = true;
                        positions.set(child, childCoords);
                        lines.push({
                            x1: parentPos.x,
                            y1: parentPos.y,
                            x2: childCoords.x,
                            y2: childCoords.y
                        });
                    } else {
                        // Adjust the angle offset
                        let currentOffset = nodeAngles.get(index) || 0;
                        nodeAngles.set(index, currentOffset + (Math.PI / 8));
                    }
                    attempts++;
                }
                //perhaps put in thing where i crontol distance offset for parent nodes and we leave randomization for angle and child node distance

                // If we couldn't find a non-overlapping position, use the last attempted position
                if (!validPosition) {
                    const finalCoords = calculateChildPosition(
                        parentPos.x, 
                        parentPos.y, 
                        index, 
                        children.length, 
                        75 + distanceOffset, 
                        isParent,
                        child
                    );
                    positions.set(child, finalCoords);
                }
            });
        }
    }

    let isParent = false;

    for (const [parent, children] of parents) {
        let xPos, yPos;
        
        
        if (parent === "Barbara") {
            xPos = centerX;
            yPos = centerY;
        } else {
            const parentCoord = allCoords.find(pair => pair.name === parent);
            if (parentCoord) {
                xPos = parentCoord.x;
                yPos = parentCoord.y;
            }
        }

        if (xPos !== undefined && yPos !== undefined) {
            if (parent !== "Barbara") {
                drawCircle(xPos, yPos, radius, parent);
            }
            
            children.forEach((child, index) => {
                let distanceOffset = nodeDistances.get(child) || 0;
                isParent = parents.has(child);
                
                const childCoords = calculateChildPosition(xPos, yPos, index, children.length, 75 + distanceOffset, isParent, child);
                drawCircle(childCoords.x, childCoords.y, radius, child, parent, distanceOffset);
            });
        }
    }

    centerNode(radius);
}

function centerNode(r) {
    // Draw the center node with offset
    drawCircle(centerX, centerY, r, "Barbara", true);
}

function addCoords(x_val, y_val, n, o) {
    let newObject = {x: x_val, y: y_val, name: n, offset: o}
    allCoords.push(newObject)

}

function drawCircle(x, y, r, name, parent=null, cen=false, offset=0) {
    const screenX = (x - offsetX) * zoom;
    const screenY = (y - offsetY) * zoom;
    const screenCenterX = (centerX - offsetX) * zoom;
    const screenCenterY = (centerY - offsetY) * zoom;
    
    if (parent === "Barbara") {
        // Calculate angle to center
        const angle = Math.atan2(screenCenterY - screenY, screenCenterX - screenX);
        // Calculate end points at circle edges
        const startX = screenX + r * zoom * Math.cos(angle);
        const startY = screenY + r * zoom * Math.sin(angle);
        const endX = screenCenterX - r * zoom * Math.cos(angle);
        const endY = screenCenterY - r * zoom * Math.sin(angle);
        
        ctx.beginPath();
        ctx.strokeStyle = '#fcb36e';
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    else if (parent !== null) {
        for (const pair of allCoords) {
            if (pair.name === parent) {
                // Calculate angle to parent
                const parentScreenX = (pair.x - offsetX) * zoom;
                const parentScreenY = (pair.y - offsetY) * zoom;
                const angle = Math.atan2(parentScreenY - screenY, parentScreenX - screenX);
                
                // Calculate end points at circle edges
                const startX = screenX + r * zoom * Math.cos(angle);
                const startY = screenY + r * zoom * Math.sin(angle);
                const endX = parentScreenX - r * zoom * Math.cos(angle);
                const endY = parentScreenY - r * zoom * Math.sin(angle);
                
                ctx.beginPath();
                ctx.strokeStyle = "#fcb36e";
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
    

    ctx.beginPath();
    ctx.arc(screenX, screenY, r * zoom, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff8100";
    ctx.fill();
    ctx.stroke();
    ctx.closePath();


    ctx.fillStyle = '#703422';
    const minFontSize = 14; 
    const baseFontSize = 16; 
    const scaledFontSize = Math.max(minFontSize, baseFontSize * Math.sqrt(zoom));  // Using square root for smoother scaling
    ctx.font = `bold ${scaledFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, screenX, screenY);


    addCoords(x, y, name, offset);
}

function drawRectangle(x, y, w, h) {
    // const ctx = canvas.getContext("2d");
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, w, h);
}

function coordinates() {
    console.log(event.clientX, event.clientY)
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 15 + 1)];
    }
    return color;
  }

// Initialize the canvas and draw
resizeCanvas(true);
drawAll(true);

// Add event listeners
window.addEventListener('resize', resizeCanvas);
document.addEventListener("wheel", function (e) {
    // Check if we're hovering over the info panel
    if (e.target.closest('#infoPanel')) {
        return;
    }
    
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = mouseX / zoom + offsetX;
    const worldY = mouseY / zoom + offsetY;
    
    const zoomFactor = e.deltaY > 0 ? 0.965 : 1.035;
    zoom *= zoomFactor;
    
    offsetX = worldX - mouseX / zoom;
    offsetY = worldY - mouseY / zoom;
    
    drawAll();
});

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    
    offsetX -= deltaX / zoom;
    offsetY -= deltaY / zoom;
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    drawAll();
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

document.addEventListener("click", circleChecker);

window.addEventListener("resize", resizeCanvas);

addEventListener("click", coordinates);

function circleChecker(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const worldX = clickX / zoom + offsetX;
    const worldY = clickY / zoom + offsetY;
    
    let found = false;
    for (const pair of allCoords) {
        if (Math.sqrt(Math.pow(worldX - pair.x, 2) + Math.pow(worldY - pair.y, 2)) < radius) {
            found = true;
            infoPanelTitle.textContent = pair.name;
            infoPanelText.style.whiteSpace = 'pre-wrap';
            infoPanelText.textContent = getCircleInfo(pair.name);
            
            // Calculate the available width - infor panel
            const availableWidth = canvas.width * 0.75; // 75% of canvas width
            
            // Adjust  offset to center within availabeWidth
            const targetOffsetX = pair.x - (availableWidth / 2) / zoom;
            const targetOffsetY = pair.y - canvas.height / (2 * zoom);
            
            // Animate  transition
            const startOffsetX = offsetX;
            const startOffsetY = offsetY;
            const duration = 700; 
            const startTime = Date.now();
            
            function animate() {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth animation
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                offsetX = startOffsetX + (targetOffsetX - startOffsetX) * easeProgress;
                offsetY = startOffsetY + (targetOffsetY - startOffsetY) * easeProgress;
                
                drawAll();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }
            
            animate();
            
            // Show info panel with transition
            infoPanel.style.opacity = '0';
            infoPanel.style.display = 'block';
            infoPanel.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                infoPanel.style.opacity = '1';
            }, 50);
            
            break;
        }
    }
    
    if (!found) {
        // Hide panel with fade out
        infoPanel.style.opacity = '0';
        setTimeout(() => {
            infoPanel.style.display = 'none';
        }, 300);
    }
}

function getCircleInfo(name) {
    const info = {
        'Dave': 'Barbara\'s son \n\n"Nonny always came to all my basketball games in my high school career. After our final loss, I was in tears at the time, she said \"I love you because you\'re my son and the sun will come up tommorrow\". The loss still stung but just knowing I always had someone in my corner did and always has made me feel like I\'m not alone and I can allow myself to fail and still be loved. And that is something I have tried to pass down to my children as well. \n\nNonny also surprised us with our Dog, Dudley. My aunt and uncle\'s dog had pupppies and we were there for a party or something and we were begging to take one home for us and Pops was not having it at all. And then like two weeks later, Nonny must have driven down there or something, and she brought him home. She had somehow convinced my dad to concede and get us a puppy. She was never going to back down from our father despite his big personality. She would always go above and beyond to make us happy".',
        'Jackie': "Barabara's daughter \n\nStruggling with adidction and a tough divorce, Jackie and her son Brian came to live with Nonny and Pops. During this time, she was supported by her parents financially, emotionally, and parentally. Jackie moved out eventually after getting back on her feet, but later in life moved back in with Nonny after Pops died. During that time Jackie and Nonny supported each other in a desperate time of need. Nonny's doors were always open, especially to her children, no matter how frustrating or difficult they could be. Jackie continued living with Nonny until she passed away early this year. ",
        'Ben' : "David's son \n\nNonny used to babysit for me and my sister a lot when we were younger. During that time, around kindergarten age, I was really struggling with anxiety about school. I felt so sad and lonely every time my parents would leave for work in the mornings, beginning the dreaded 9 hour break where I couldn’t talk to them. What helped me most to get through this was Nonny. Every morning, Nonny would wake us up with pancakes and songs and her signature warmth that allowed me to calm my separation anxiety. When she saw me panicking she remained patient and caring and always talked me through it while still somehow getting me to school on time. Without her, I would\’ve been overcome with my sadness, preventing me from focusing in or enjoying school. This is only a tiny fraction of all she has done for me but her kindness truly transformed this period of my life and I appreciate her so much for that.",
        'Jennifer' : 'David\'s wife \n\n"Barbara would help babysit the kids a lot and I believe she made a big impact in terms of their development. Just the way she took care of them - she brought a sensibilty from another time. She made very common, everyday things very special for you two [her kids]. Picking up sticks for pennies, taking family walks, singing to them (to which they would ask her to turn up the volume). She had a very heart-centered, present way of being with the children. She would never spend time with you guys through screens like movies or devices, she just truly enjoyed your company. She set up the expectation that being with people you love can make things feel magical and special. She also went out of her way to get to know, not just me, but my sisters and my grandma and aunts and uncles. She made sure to include them in family events and make them feel like they were a part of the Sherman family."',
        'Ryan' : 'Missy\'s grandson\n\n\"Nonny babysat me every Tuesday for most of my childhood. Some of my best memories from those years are of her creating fun activities for us out of almost nothing. She would have us pick up sticks for pennies or play “swing soccer” or sing songs on walks around the neighborhood. I was never bored and always excited to hear about her next idea. She taught me to find fun and adventure in everyday situations, and my life is more magical and fun because I grew up with her influence\"',
        'Gillian' : "Tina's daughter\n\n\"I remember when Nonny stopped a guy from stealing my bike. She had been watching me play outside for a while and we had just gone in to eat or something and I looked outside and saw a guy in a pickup truck pull up and start walking toward my bike. I pointed it out to Nonny and immediately she walked out the front door and went to confront this, like, random guy in our driveway. I was watching from the screen door and I saw her, super calmly, ask the guy “what do you think you\’re doing?” The guy fed her some nonsense about being a garbage hunter but the bike was basically at the doorstep. Anyway, he backed up and hopped back in his truck and sped off. When my parents got back I told them what happened and they asked Nonny “Are you sure that was safe?”, to which she replied, “I wasn\’t even thinking about that”. She wasn\’t afraid at all. She was too concerned with making sure nobody took her grandchild's bike. She\’s never one to back down when it comes to her family for sure\".", 
        'Andy' : "Barbara's son\n\n\"When I was in maybe 7th grade or so, I had been procrastinating on a project for like, a month. I had just been goofing off the whole time instead of working on it or something. So, as the month ends and the project deadline approaches - and this is a big project - I realize that the situation has turned drastic. I tried to get started on it but I realized fast that I had nowhere near enough time (because of all the goofing around). So that’s when I go crying to mom. Of course, I don’t tell her that I had been doing nothing for a month now, I tell her that we were only given this last week to do it. Finally, my pity party finishes, and she agrees to help but only says that she will observe and manage - I have to do the actual work myself. I’m a little upset, but of course, some help is better than no help, so I agree. We go back to the project and I don’t even know where to start. The project feels completely out of my league. Mom gives the assignment a quick read and simply tells me to write my name. I do that and then she tells me to write the project title. I continued following her tiny little demands until eventually I realized I’ve completed most of the project. The enormous project only seemed insurmountable because I was looking at it wrong. Mom was the first to make me realize how important steady, slow progress is when tackling a big problem\".", 
        'Megan' : "Tina's daughter\n\n\"When I was in my early 20s, feeling lost after dropping out of college, I didn’t know what direction my life was headed. That’s when Nonny stepped in and gave me a job at her sandwich shop. It wasn’t just a paycheck—it was a lifeline. She didn’t judge me for feeling adrift; instead, she offered a safe space where I could find my footing again. Working with her, I learned the value of hard work as well as crucial listening and communication skills which would serve me well down the line as a therapist. Through our long conversations, Nonny helped me realize that I wasn’t lost - I was just on a different path. That job at the sandwich shop became the foundation for my future. It gave me the financial security to go back to school and pursue my dream. I’ll always be grateful for the way she believed in me when I didn’t believe in myself, as she always does for every person she encounters who is adrift or alone\"",
        'Brian' : "Jackie's son\n\n\"While Jackie [Brian’s mom] was young, after she had just had Brian, she went through a pretty tough divorce. During this time, Jackie moved back in with Nonny and Papa, and brought Brian along with her. While living there, Nonny grew very close with Brian, often having to take care of him while Jackie was out working. I think Brian was able to witness (being in this open household full of so many characters) how important helping out the people around you - or your community - really is. I think that might be part of the reason he decided to become a cop later in his life: that sense of responsibility and care for his community and those around him.\" \n\nQuote from David Sherman",
        'Ella' : "David's daughter\n\n\"I’ve known I was gay since I was 15 years old, but I delayed coming out to my grandparents until I was 21. I knew they were progressive and kind people and that they loved me deeply, but I don’t have other queer members of my family, and I was scared to be the first. I ended up texting my grandmother (Nonny!) this past May and telling her that my girlfriend (who she knew up to this point as my friend) and I had been together as a couple for 4 and a half years. I think she probably already somewhat knew or at least suspected this, but despite this being something I could’ve and should’ve told her several years earlier, her response was incredibly gracious and loving and has stuck with me and moved me deeply since. \nShe wrote to me that \“To find love with another is the greatest of gifts, far more important than career choice, where you're going to live, anything. In my world, there is no need to explain one's sexuality to anyone. Be who you are. I will always be there for you. Much happiness to you and Aleks. Love you both. Nonny.\” In a world where there’s significant prejudice and hate directed towards queer people and towards anyone who dares to deviate from what is deemed normative, I feel that Nonny stands as an example of exactly the opposite: love, bravery, and radical and unconditional acceptance. She is incredibly open-minded and open-hearted, and while I would love for there to be a world where there are more people like her, she is also truly one of a kind, and I feel unbelievably lucky to know her and be loved by her.\"",
        'Aleks' : "Ella's girlfriend\n\n\"I first met nonny while I was in high-school, when me and my best friend Ella stepped into her apartment, right before our homecoming dance. She lives a few blocks away from our high school and Ella wanted me to meet her. I had heard so much about her already and she lived up to all of it. She was so incredibly kind and welcoming. I remember feeling that she genuinely cared about me that very first time we met. When me and Ella started dating, Ella was nervous to tell her, but I remember feeling so sure that her reaction would be positive. It was more than positive, it was beautiful. I’ve seen her impact on her family and everyone around her, and it’s so lovely\".",
        'Casey' : "Tina's childhood friend\n\nCasey was a childhood friend of Tina and Matthew, two of Nonny’s children. He was aware of his identity as a gay man even in childhood, but he grew up in a very Catholic family and neighborhood in the 1970s and 1980s, and he didn’t feel comfortable coming out to them or to anyone until his adulthood. However, he cited Nonny as a dominant influence in what made him feel comfortable enough to do so in his early adulthood, saying she made him feel seen and heard in the Sherman house in a way he didn’t at home. This gave him the sense of self-confidence and self-worth that allowed him to come out and to feel comfortable being his full and true self even in a community and family that was not always fully accepting. Nonny is the testament to the power of a kind and influential individual taking the time to truly see and hear someone who feels isolated, othered, and alone. Her capacity for acceptance and open-heartedness and her ability and desire to see to the core of people’s being changed the course of Casey Jones’s life. Even as a middle aged man, he credits Nonny to this day for the beautiful life he has built for himself in which he feels comfortable enough to live fully in his identity as a gay man in a neighborhood where he once felt too insecure and afraid to come out, and he will be part of a generation that normalizes and celebrates queer identities and provides to others the same acceptance Nonny offered him. The powerful influence of Nonny’s kindness will have ripple effects that can change a community and make it so other queer people like Casey Jones don’t have to feel scared or alone.",
        'Mary' : "Family friend \n\nMary Lane grew up as a childhood friend of the Sherman children, and she credits Nonny as inspiring her to realize that the world was bigger than Evergreen Park (the suburb of Chicago where they grew up). This was notoriously a somewhat closed off community where many people never have the chance to explore other cities or another way of life, and the dominant social structure (Catholicism, heterosexual marriage, 2.5 children, a working father, a stay-at-home mother) was heavily imposed on everyone living there. However, Nonny broke this mold. She did not ascribe to a traditional organized religion at this time; she had a husband and 7 children but did not identify solely with the wife and mother role; she worked as a secretary for an organizational psychology company but rose to a role within their administrative infrastructure (who they essentially relied on to run the company) purely because of her incredible capabilities and immense skill with people. Mary Lane recalls watching Nonny walk 3 miles to the commuter train and 3 miles back every day to her 9-5 and then spending her mornings and nights caring for her home and family and being in awe of how much Nonny had made possible for herself through the power of her own determination, intelligence, and hard work. This inspired Mary Lane’s own journey to business school out of state (which was unheard of in a neighborhood where the farthest anyone went was Champaign, Illinois to the University of Illinois) and to an eventual position as a senior executive at a large company in New York City while also maintaining a marriage and a family. This is a life that most people wouldn’t have dreamed possible in Evergreen Park, especially at that time, and Nonny inspired her to shoot for this dream and gave her a role model for a version of success beyond the bounds of solely a mother and wife or a successful businessperson.",
        'Frankie' : "Matt's daughter\n\n\"Every Christmas for as long as I can remember, I’ve stood next to Nonny at her kitchen counter on December 23, watching her carefully measure out the ingredients for snickerdoodles. I used to worry that all our talking and laughing was distracting her from her task, but she always insisted on hearing updates about my friends, my school, and my life. Some years, the cookies burn. Others, they’re a little underbaked. Others, they come out absolutely perfect. Either way, it never seems to phase Nonny. Over the years, I’ve come to realize baking together is less about the product and more about the experience. The time spent together is much more valuable than the quality of the snickerdoodle. Nonny taught me to slow down and value experiences not from what I can get out of them but for who I can enjoy them with\"",
        'Matt' : "Barbara's son\n\nMy grandmother had a profound influence on my Uncle Matt's love of music, sparking his passion for music at a young age. She was always playing the piano, singing around the house, playing records and then tapes and then CDs of all different genres. Despite having 7 kids, Nonny always took the time to make each of them feel special. She bought Uncle Matt his first guitar after he was inspired by her deep appreciation and love for listening to and making music. As he grew older, her encouragement and belief in his potential were the driving forces behind his decision to form a band as an adult. She not only nurtured his natural talent but also showed him that music could be a lifelong pursuit, one that brings joy, connection, and a sense of purpose. Her unwavering support and lifelong love of music helped him to turn his passion into a reality",
        'Buzz' : "Jennifer's father\n\nJohn \“Buzz\” Brendel was the father of Jennifer, David’s wife. He was a big personality who could talk to a friend for hours without being satisfied. After he and his wife, Judy, moved to Montana, he slowly realized that he had less and less people to talk to around him. Alder, Montana is a very sparsely populated area which didn’t match up with Buzz’s love of conversation. This lack of connections became especially apparent as more and more of Buzz and Judy’s friends began to pass away as they got older. However, one friend, Barbara Sherman, would call Buzz and Judy every Thursday. Despite having little understanding of technology herself, Nonny was able to orchestrate these calls weekly to check up on Buzz and Judy and help ease their isolation. My grandfather always said that these calls were very special to him and always told me to thank Nonny when I saw her next. I’m sure my grandmother would never consider this an act of generosity, but in Buzz’s eyes, it was an incredible kindness",
        'Cathleen' : "Jimmy's wife\n\n\“We were returning from Mexico together. Jim wanted me to leave behind the \"too heavy rocks\" I had collected on the beach. I left them behind. Nonny stopped by  our house later with the beach collection I thought I had sadly left behind. She also brought me the decorative clay sun I had been eyeing in one of the local shops\”",
        'Jimmy' : "Barbara's son\n\n\"I can't think of one particular story, I just know that there has never been a moment in my life when I needed mom and she wasn't there for me. What else could any of us ask for? She is quiet but tough, selfless and humble. She does so much for so many and never seeks an ounce of recognition. The world is a better place because of her\"",
        'Tina' : "Barbara's daughter\n\n\"Nonny is an amazing person aside from being the matriarch of a large loving family. She is kindness personified, a great listener, and always warm. She has recommended amazing life changing books and art independent and strident visiting sick fellow parishioners in underserved communities. She is pragmatic and tough, but curious and artful. She’s the quiet warrior queen\"",
        'Missy' : "Barbara's daughter\n\n\"Missy and Russ had moved to Lousiana. Russ had got a job down there. I think they moved down there in January and their house flooded in April? We were down there on vacation and the first night and it had been raining all day, and they had a creek behind their house. So we were out in the garage talking and we started seeing the water creep up the driveway. We tried to stop the flooding with some sandbags but as we were walking around in the water we saw a water snake swimming on top of the water, so we abandoned that pretty quick. Anyway, we abandoned the house and went to a motel. After that, Missy and Russ came back with us and moved back in with the family. They lived with us for about 6 months before they could get back on their feet. After that - I think they realized how much they loved being with the family - they decided to stay in Chicago and have lived there ever since\"",
        'Russ' : "Missy's husband\n\n\"Missy and Russ had moved to Lousiana. Russ had got a job down there. I think they moved down there in January and their house flooded in April? We were down there on vacation and the first night and it had been raining all day, and they had a creek behind their house. So we were out in the garage talking and we started seeing the water creep up the driveway. We tried to stop the flooding with some sandbags but as we were walking around in the water we saw a water snake swimming on top of the water, so we abandoned that pretty quick. Anyway, we abandoned the house and went to a motel. After that, Missy and Russ came back with us and moved back in with the family. They lived with us for about 6 months before they could get back on their feet. After that - I think they realized how much they loved being with the family - they decided to stay in Chicago and have lived there ever since\"",
        'Terry' : "Jim's friend\n\n\"He was quite the character. He was extremely intelligent. He got a Ph.D. from Loyola University. He played the piano by ear. He was an artist and actually had his works displayed in a gallery. He taught at Purdue University in their English department. And there again, I wound up, you know, being home with many children. I ended up typing his Ph.D. dissertation. But he was a huge influence on all our lives. And I think I was an influence on his. I was a stabilizing entity for someone who just didn’t know what he wanted to be when he grew up. And I don’t think he knew what he wanted to be even until the day he passed. And he took his own life, which was heartbreaking, to say the least. He babysat a lot for our young family and became quite the character. He’d have the kids in the car, and they’d be singing songs loudly as they traveled around Evergreen Park. Oh my goodness! He was an incredible influence on all of our lives\"",
        'Nora' : "Jim's student\n\n\"Over the years, many people lived with us while we were raising our family, one of whom was a woman named Nora Hussey. She came to our family because she enrolled in a theater program that your grandfather ran on behalf of the government. It was called the Chicago Area Repertory Company, and they produced plays and performed in various venues across the city. She ultimately married one of the young men from that student group. Their marriage, however, was not a marriage made in heaven, and she ended up living with us for six months. She was as much of an influence on me as I was on her, and to this day, we are still very close friends\"",
        'Kim' : "Barbara's friend\n\n\"We also had people who used to visit during the day, one of whom was a teacher from Evergreen Park High School [Kim]. I don’t know why she came, I don’t even know how I got involved with her, but I did, and she came and would sit for hours talking about her issues and her, you know, goals for life and all this kind of thing\"",
        'Jim' : "Barbara's husband\n\nI can't say I knew my Grandfather very well before he passed, but I did know that he loved my Grandmother and his children and grandchildren more than anything else in the world. He was a a big personality and was known to have a somewhat short fuse. I remember that Nonny was always the one who not only wouldn't back down from his anger, but would scold and call him out for his actions. She was also the only one who could really calm him down and bring him back down to Earth. I think he really would not have been the amazing man he was if not for Nonny always keeping him in check. He truly chose the perfect partner who loved him enough to keep him in line.",
        'Barbara' : "\"She is quiet but tough, selfless and humble. She does so much for so many and never seeks an ounce of recognition. The world is a better place because of her\" \n - Jimmy \n\n\"She’s never one to back down when it comes to her family\" \n - Gillian \n\n\"Mom, though the mother of seven, and working full time, always made time to listen and care for the people who found themselves staying in our home\" \n - Missy \n\n\"She is selfless and gives and gives and gives some more. It is the way she lives that sets the example. She is a saint\" \n - Matt \n\n\"Patient, kind and forgiving. She'll listen to you even if she thinks you're wrong. A truly beautiful human being\" \n - Jimmy \n\n\"I’ve seen her impact on her family and everyone around her, and it’s so lovely\"\n - Aleks \n\n\"She is incredibly open-minded and open-hearted, and while I would love for there to be a world where there are more people like her, she is also truly one of a kind, and I feel unbelievably lucky to know her and be loved by her\" \n - Ella"





        // Add more entries as needed
    };
    return info[name] || 'No information available.';
}

