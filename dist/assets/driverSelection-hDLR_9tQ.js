import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */import{i as v,b as h,c as b,d as y}from"./map-utils-Cm6qByqs.js";let r,u;const p=JSON.parse(localStorage.getItem("vride_pickup")),l=JSON.parse(localStorage.getItem("vride_drop"));document.addEventListener("DOMContentLoaded",async()=>{if(!p||!l){window.location.href="home.html";return}r=v("selection-map",{zoomControl:!1,attributionControl:!1});try{const a=await h(p,l);u=L.polyline(a.coordinates,{color:"#4a9eff",weight:5,opacity:.8,lineJoin:"round"}).addTo(r),L.marker([p.lat,p.lng]).addTo(r),L.marker([l.lat,l.lng]).addTo(r),r.fitBounds(u.getBounds(),{padding:[50,50]})}catch(a){console.error("Route error:",a)}setTimeout(()=>{const d=JSON.parse(localStorage.getItem("vride_profile")||"{}").gender||"",t=b(l,d),c=y(t,d);k(c)},1500)});function k(a,d){const t=document.getElementById("drivers-list");t.innerHTML="";const c=a.filter(e=>e.rating>=4.7);let s=null,i=null;c.forEach(e=>{e.gender==="female"?(!s||e.price<s.price||e.price===s.price&&e.rating>s.rating)&&(s=e):e.gender==="male"&&(!i||e.price<i.price||e.price===i.price&&e.rating>i.rating)&&(i=e)}),a.forEach((e,f)=>{const n=document.createElement("div");n.className="driver-item";const m=s&&e.id===s.id,g=i&&e.id===i.id;f===0&&n.classList.add("best-match"),(m||g)&&n.classList.add("safety-match");let o="";m?(o+='<span class="safety-badge"><i class="fa-solid fa-shield-heart"></i> Safety Choice</span>',o+='<span class="recommended-badge"><i class="fa-solid fa-thumbs-up"></i> Recommended</span>'):g?(o+='<span class="cheap-badge"><i class="fa-solid fa-tag"></i> Cheap</span>',o+='<span class="recommended-badge"><i class="fa-solid fa-thumbs-up"></i> Recommended</span>'):f===0&&(o+='<span class="recommended-badge"><i class="fa-solid fa-star"></i> Recommended</span>'),n.innerHTML=`
                    <div class="driver-info">
                        <div class="vehicle-icon-bg">
                            <i class="fa-solid fa-${e.type==="bike"?"motorcycle":e.type==="auto"?"taxi":"car"}"></i>
                        </div>
                        <div class="driver-details">
                            <div class="driver-name-row">
                                <span class="driver-name">${e.name}</span>
                                <span class="driver-rating">
                                    <i class="fa-solid fa-star"></i> ${e.rating}
                                </span>
                            </div>
                            <div class="badges-container" style="display: flex; gap: 5px; margin-top: 4px; flex-wrap: wrap;">
                                ${o}
                                ${e.occupancy>0?`<span class="occupancy-badge" style="background: rgba(255, 159, 10, 0.2); color: #ff9f0a; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(255, 159, 10, 0.3);"><i class="fa-solid fa-users"></i> ${e.occupancy} Passenger${e.occupancy>1?"s":""}</span>`:'<span class="occupancy-badge" style="background: rgba(48, 209, 88, 0.2); color: #30d158; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(48, 209, 88, 0.3);"><i class="fa-solid fa-check"></i> Empty</span>'}
                            </div>
                            <span class="vehicle-name" style="margin-top: 4px; display: inline-block;">${e.vehicle}</span>
                            <div class="driver-meta">
                                <span><i class="fa-solid fa-clock"></i> ${e.eta} away</span>
                            </div>
                        </div>
                    </div>
                    <div class="price-action">
                        <span class="price">₹${e.price}</span>
                        <button class="book-btn" onclick="selectDriver('${e.id}')">Select</button>
                    </div>
                `,t.appendChild(n)})}window.selectDriver=a=>{const t=b().find(c=>c.id===a);localStorage.setItem("vride_active_driver",JSON.stringify(t)),window.location.href="tracking.html"};
