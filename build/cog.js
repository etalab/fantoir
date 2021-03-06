const {groupBy, maxBy, uniq, flattenDeep} = require('lodash')
const historiqueCommunes = require('@etalab/decoupage-administratif/graph-communes')
const arrondissementsMunicipaux = require('@etalab/decoupage-administratif/data/communes.json')
  .filter(c => c.type === 'arrondissement-municipal')
  .map(c => ({code: c.code, nom: c.nom, type: 'COM'}))

const byCodeCommune = groupBy(historiqueCommunes.concat(arrondissementsMunicipaux), h => `${h.type}${h.code}`)

const MARSEILLE_MAPPING = {
  13331: '13201',
  13332: '13202',
  13333: '13203',
  13334: '13204',
  13335: '13205',
  13336: '13206',
  13337: '13207',
  13338: '13208',
  13339: '13209',
  13340: '13210',
  13341: '13211',
  13342: '13212',
  13343: '13213',
  13344: '13214',
  13345: '13215',
  13346: '13216'
}

function normalizeCodeCommune(codeCommune) {
  if (codeCommune in MARSEILLE_MAPPING) {
    return MARSEILLE_MAPPING[codeCommune]
  }

  return codeCommune
}

function getCodeDepartement(codeCommune) {
  return codeCommune.startsWith('97') ? codeCommune.substr(0, 3) : codeCommune.substr(0, 2)
}

const COM = {
  97123: {code: '97123', nom: 'Saint-Barthelemy', type: 'COM'},
  97127: {code: '97127', nom: 'Saint-Martin', type: 'COM'}
}

function getCommune(codeCommune) {
  if (codeCommune in COM) {
    return COM[codeCommune]
  }

  const candidates = byCodeCommune[`COM${codeCommune}`]

  if (candidates) {
    return candidates.find(c => !c.dateFin)
  }
}

function getCommuneActuelle(communeEntry) {
  if (typeof communeEntry === 'string') {
    const candidates = byCodeCommune[`COM${normalizeCodeCommune(communeEntry)}`]

    if (candidates) {
      return getCommuneActuelle(maxBy(candidates, c => c.dateFin || '9999-99-99'))
    }

    return
  }

  if (!communeEntry.dateFin && communeEntry.type === 'COM') {
    return communeEntry
  }

  if (!communeEntry.dateFin) {
    return getCommuneActuelle(communeEntry.pole)
  }

  if (communeEntry.successeur) {
    return getCommuneActuelle(communeEntry.successeur)
  }
}

function getCodesMembres(commune) {
  return uniq([
    commune.code,
    ...flattenDeep((commune.membres || []).map(getCodesMembres)),
    ...flattenDeep(commune.predecesseur ? getCodesMembres(commune.predecesseur) : [commune.code])
  ])
}

function getCommunes() {
  return historiqueCommunes
    .filter(h => !h.dateFin && h.type === 'COM')
    .concat(arrondissementsMunicipaux)
}

module.exports = {getCommunes, getCodesMembres, getCodeDepartement, getCommune, getCommuneActuelle}
