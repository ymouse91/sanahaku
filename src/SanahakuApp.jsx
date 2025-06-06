import { useState, useRef } from "react";
import { wordList } from "./wordList";
import "./App.css";

const sanaSet = new Set(wordList);

export default function SanahakuApp() {
  const [sana, setSana] = useState("");
  const [tulos, setTulos] = useState(null);
  const [synonyymit, setSynonyymit] = useState(null);
  const [tila, setTila] = useState("idle"); // idle | loading | valmis | virhe
  const inputRef = useRef(null);

  const haeMerkitys = async () => {
    const sanaTrim = sana.trim().toLowerCase();

    if (!sanaTrim) {
      setTulos("Anna sana ennen hakua.");
      setTila("valmis");
      return;
    }

    setSynonyymit(null);

    if (!sanaSet.has(sanaTrim)) {
      setTulos(`Sanaa '${sanaTrim}' ei löydy sanalistasta.`);
      setTila("valmis");
      return;
    }

    setTila("loading");
    try {
      const response = await fetch(
        `https://fi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sanaTrim)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.extract) {
          const firstWord = data.extract.trim().split(" ")[0];
          if (firstWord[0] === firstWord[0].toUpperCase()) {
            // Erisnimi → jatketaan Wikisanakirjaan
          } else {
            setTulos(`${data.extract} (Lähde: Wikipedia)`);
            setTila("valmis");
            return;
          }
        }
      }

      const wikiSanakirjaResponse = await fetch(
        `https://fi.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(sanaTrim)}&prop=text&formatversion=2&format=json&origin=*`
      );

      if (wikiSanakirjaResponse.ok) {
        const data = await wikiSanakirjaResponse.json();
        const htmlText = data.parse?.text || "";
        const määritelmä = htmlText.match(/<li>(.*?)<\/li>/i)?.[1];
        const plain = määritelmä?.replace(/<[^>]+>/g, "");
        if (plain) {
          setTulos(`${plain} (Lähde: Wikisanakirja)`);
        } else {
          setTulos(`Sanaa '${sanaTrim}' ei löytynyt Wikipediasta tai Wikisanakirjasta.`);
        }

        // Yritetään poimia synonyymit
        const synonyymiOtsikko = htmlText.indexOf("<h3>Synonyymit</h3>");
        if (synonyymiOtsikko !== -1) {
          const synonyymiOsio = htmlText.substring(synonyymiOtsikko);
          const matchit = [...synonyymiOsio.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
          const puhdistetut = matchit.map((r) => r.replace(/<[^>]+>/g, ""));
          if (puhdistetut.length > 0) {
            setSynonyymit(puhdistetut);
          }
        }
      } else {
        setTulos(`Sanaa '${sanaTrim}' ei löytynyt Wikipediasta tai Wikisanakirjasta.`);
      }
    } catch (err) {
      setTulos("Virhe haettaessa tietoa internetistä.");
    }
    setTila("valmis");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      haeMerkitys();
    }
  };

  const nollaa = () => {
    setSana("");
    setTulos(null);
    setSynonyymit(null);
    setTila("idle");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  
  const avaaKotusHaku = () => {
    const sanaTrim = sana.trim().toLowerCase();
    if (!sanaTrim) return;
    const kotusURL = `https://www.kielitoimistonsanakirja.fi/#/${encodeURIComponent(sanaTrim)}`;
    window.open(kotusURL, "_blank");
  };

  const kotusURL = `https://www.kielitoimistonsanakirja.fi/#/Koti?searchMode=all&searchWord=${encodeURIComponent(sana.trim().toLowerCase())}&_=${Date.now()}`;

  return (
    <div className="container">
      <div className="logo-wrapper">
        <img src="logo.png" alt="Tavukolmio Logo" className="logo" />
      </div>
      <h1 className="title">Tavukolmio - Sanahaku</h1>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          placeholder="Anna suomenkielinen sana"
          value={sana}
          onChange={(e) => setSana(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={haeMerkitys}>Hae merkitys</button>
      </div>
      {tila === "loading" && <p>Haetaan tietoa...</p>}
      {tulos && (
        <div className="card">
          <div className="card-content">
            <p className="result-text">{tulos}</p>
            {synonyymit && (
              <div>
                <strong>Synonyymit:</strong>
                <ul>
                  {synonyymit.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
             <button className="link-button" onClick={avaaKotusHaku}>
               &gt;&gt; Katso Kielitoimiston sanakirjasta
            </button>
            </div>
			            <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
              <button onClick={nollaa}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
